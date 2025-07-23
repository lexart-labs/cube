<template>
    <div>
        <h2>
            <b>{{ $t('generic.onboardingUsers') || 'Onboarding Users' }}</b>
        </h2>

        <!-- Search filters -->
        <div class="row mb-3 mt-3">
            <div class="col-md-4">
                <input
                    type="text"
                    class="form-control"
                    placeholder="Search by email..."
                    v-model="filters.email"
                    @input="applyFilters"
                >
            </div>
            <div class="col-md-3">
                <select
                    class="form-control"
                    v-model="filters.status"
                    @change="applyFilters"
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>
            <div class="col-md-3">
                <select class="form-control" v-model="pageSize" @change="fetchUsers">
                    <option value="10">10 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                </select>
            </div>
            <div class="col-md-2">
                <button
                    class="btn btn-secondary btn-sm"
                    @click="clearFilters"
                >
                    Clear Filters
                </button>
            </div>
        </div>

        <div v-if="isLoading" class="text-center">
            <Spinner />
        </div>

        <table v-else class="table table-striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>KYC Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="user in filteredItems" :key="user.id">
                    <td>{{ user.id }}</td>
                    <td>{{ user.fullName || user.name }}</td>
                    <td>{{ user.email }}</td>
                    <td>
                        <span :class="getStatusBadgeClass(user.kyc_status)">
                            {{ formatStatus(user.kyc_status) }}
                        </span>
                    </td>
                    <td>{{ formatDate(user.created_at) }}</td>
                    <td>
                        <button
                            class="btn btn-info btn-sm mr-1"
                            @click="viewUser(user)"
                        >
                            View
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Show message when no users found -->
        <div v-if="!isLoading && filteredItems.length === 0" class="text-center mt-4">
            <p class="text-muted">No users found matching the current filters.</p>
        </div>

        <!-- Pagination -->
        <nav v-if="!isLoading && totalPages > 1">
            <span
                v-on:click="changePage(page - 1)"
                :class="page === 0 ? 'not-allowed' : ''"
            >
                {{ $t('generic.previous') || 'Previous' }}
            </span>
            <span class="current-page">{{ page + 1 }} / {{ totalPages }}</span>
            <span
                v-on:click="changePage(page + 1)"
                :class="page >= totalPages - 1 ? 'not-allowed' : ''"
            >
                {{ $t('generic.next') || 'Next' }}
            </span>
        </nav>

        <!-- User Details Modal -->
        <div v-if="showModal" class="modal-overlay" @click="closeModal">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h4>User Details</h4>
                    <button class="close-btn" @click="closeModal">&times;</button>
                </div>
                <div class="modal-body" v-if="selectedUser">
                    <!-- Basic Information -->
                    <div class="section">
                        <h5>Basic Information</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>ID:</strong> {{ selectedUser.id }}</p>
                                <p><strong>Name:</strong> {{ selectedUser.name }}</p>
                                <p><strong>Email:</strong> {{ selectedUser.email }}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Status:</strong>
                                    <span :class="getStatusBadgeClass(selectedUser.kyc_status)">
                                        {{ formatStatus(selectedUser.kyc_status) }}
                                    </span>
                                </p>
                                <p><strong>Created:</strong> {{ formatDate(selectedUser.created_at) }}</p>
                                <p><strong>Updated:</strong> {{ formatDate(selectedUser.updated_at) }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- KYC Information -->
                    <div class="section" v-if="selectedUser.userKyc">
                        <h5>KYC Information</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Full Name:</strong> {{ selectedUser.userKyc.full_name || 'N/A' }}</p>
                                <p><strong>Identity Document:</strong> {{ selectedUser.userKyc.identity_document || 'N/A' }}</p>
                                <p><strong>Phone:</strong> {{ selectedUser.userKyc.phone || 'N/A' }}</p>
                                <p><strong>Emergency Phone:</strong> {{ selectedUser.userKyc.emergency_phone || 'N/A' }}</p>
                                <p><strong>Country:</strong> {{ selectedUser.userKyc.country || 'N/A' }}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Full Address:</strong> {{ selectedUser.userKyc.full_address || 'N/A' }}</p>
                                <p><strong>IBAN:</strong> {{ selectedUser.userKyc.iban || 'N/A' }}</p>
                                <p><strong>Intermediary Bank:</strong> {{ selectedUser.userKyc.intermediary_bank || 'N/A' }}</p>
                                <div v-if="selectedUser.userKyc.profile_photo">
                                    <strong>Profile Photo:</strong>
                                    <br>
                                    <img
                                        :src="getProfilePhotoUrl(selectedUser.userKyc.profile_photo)"
                                        alt="Profile Photo"
                                        class="profile-photo"
                                        @error="handleImageError"
                                    >
                                </div>
                            </div>
                        </div>

                        <!-- Bank Information -->
                        <div class="row mt-3" v-if="selectedUser.userKyc.bank_information">
                            <div class="col-12">
                                <p><strong>Bank Information:</strong></p>
                                <pre class="bank-info">{{ selectedUser.userKyc.bank_information }}</pre>
                            </div>
                        </div>
                    </div>

                    <!-- Company Information -->
                    <div class="section" v-if="selectedUser.userKyc && (selectedUser.userKyc.company_name || selectedUser.userKyc.company_rut || selectedUser.userKyc.company_address)">
                        <h5>Company Information</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Company Name:</strong> {{ selectedUser.userKyc.company_name || 'N/A' }}</p>
                                <p><strong>Company RUT:</strong> {{ selectedUser.userKyc.company_rut || 'N/A' }}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Company Address:</strong> {{ selectedUser.userKyc.company_address || 'N/A' }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Additional Information -->
                    <div class="section" v-if="selectedUser.adjunctSignedFiles">
                        <h5>Additional Information</h5>
                        <p><strong>Adjunct Signed Files:</strong></p>
                       	<a :href="onboardingUrl + 'uploads/contracts/' + selectedUser.adjunctSignedFiles.nda" target="_blank">Signed NDA</a>
												<br>
												<a :href="onboardingUrl + 'uploads/contracts/' + selectedUser.adjunctSignedFiles.service_agreement" target="_blank">Signed Service Agreement</a>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="closeModal">Close</button>
                    <button
                        v-if="selectedUser && (selectedUser.kyc_status === 'pending' || selectedUser.kyc_status === 'under_review')"
                        class="btn btn-success mr-2"
                        @click="approveUser(selectedUser.id)"
                    >
                        Approve
                    </button>
                    <button
                        v-if="selectedUser && (selectedUser.kyc_status === 'pending' || selectedUser.kyc_status === 'under_review')"
                        class="btn btn-danger"
                        @click="rejectUser(selectedUser.id)"
                    >
                        Reject
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import OnboardingUsersService from '@/services/onboardingUsers.service.js';
import Spinner from '@/components/Spinner.vue';
import { ONBOARDING_URL } from '../../../env';

export default {
    components: {
        Spinner
    },
    data() {
        return {
            isLoading: false,
            items: [],
            filteredItems: [],
            filters: {
                email: '',
                status: ''
            },
            page: 0,
            pageSize: 10,
            totalPages: 0,
            totalItems: 0,
            showModal: false,
            selectedUser: null,
						onboardingUrl: ONBOARDING_URL
        };
    },
    mounted() {
        this.fetchUsers();
    },
    methods: {
        async fetchUsers() {
            this.isLoading = true;
            try {
                const params = {
                    page: this.page,
                    limit: this.pageSize,
                    status: this.filters.status || 'pending',
                    email: this.filters.email
                };

                const response = await OnboardingUsersService.getAll(params);

                // Handle the new API response structure
                this.items = response.data.users || [];
                // Update pagination from the API response
                if (response.pagination) {
                    this.totalItems = response.pagination.total || 0;
                    this.totalPages = response.pagination.totalPages || Math.ceil(this.totalItems / this.pageSize);
                } else {
                    this.totalItems = this.items.length;
                    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
                }

                this.applyFilters();
            } catch (error) {
                console.error('Error fetching users:', error);
                this.$toasted.error('Error loading users');
                // Reset data on error
                this.items = [];
                this.filteredItems = [];
                this.totalItems = 0;
                this.totalPages = 0;
            } finally {
                this.isLoading = false;
            }
        },
        applyFilters() {
            this.filteredItems = this.items.filter(item => {
                return (!this.filters.email || item.email.toLowerCase().includes(this.filters.email.toLowerCase())) &&
                       (!this.filters.status || item.kyc_status === this.filters.status);
            });
        },
        clearFilters() {
            this.filters = {
                email: '',
                status: ''
            };
            this.page = 0;
            this.fetchUsers();
        },
        changePage(newPage) {
            if (newPage >= 0 && newPage < this.totalPages) {
                this.page = newPage;
                this.fetchUsers();
            }
        },
        viewUser(user) {
            this.selectedUser = user;
            this.showModal = true;
        },
        closeModal() {
            this.showModal = false;
            this.selectedUser = null;
        },
        getProfilePhotoUrl(filename) {
            // Adjust this URL based on your file storage configuration
            return `${ONBOARDING_URL}uploads/${filename}`;
        },
        handleImageError(event) {
            event.target.style.display = 'none';
        },
        async approveUser(userId) {
            try {
                await OnboardingUsersService.updateStatus(userId, 'approved');
                this.$toasted.success('User approved successfully');
                this.closeModal();
                this.fetchUsers();
            } catch (error) {
                console.error('Error approving user:', error);
                this.$toasted.error('Error approving user');
            }
        },
        async rejectUser(userId) {
            try {
                await OnboardingUsersService.updateStatus(userId, 'rejected');
                this.$toasted.success('User rejected successfully');
                this.closeModal();
                this.fetchUsers();
            } catch (error) {
                console.error('Error rejecting user:', error);
                this.$toasted.error('Error rejecting user');
            }
        },
        getStatusBadgeClass(status) {
            switch (status) {
                case 'approved': return 'badge badge-success';
                case 'rejected': return 'badge badge-danger';
                case 'pending': return 'badge badge-warning';
                case 'under_review': return 'badge badge-info';
                default: return 'badge badge-secondary';
            }
        },
        formatStatus(status) {
            if (!status) return 'Unknown';
            return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        },
        formatDate(dateString) {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleDateString();
        }
    }
};
</script>

<style scoped>
.not-allowed {
    cursor: not-allowed;
    opacity: 0.5;
}

.current-page {
    margin: 0 10px;
    font-weight: bold;
}

span {
    cursor: pointer;
    padding: 5px 10px;
    margin: 0 2px;
    border: 1px solid #ddd;
    border-radius: 3px;
}

span:hover:not(.not-allowed) {
    background-color: #f5f5f5;
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
}

.modal-header h4 {
    margin: 0;
    color: #333;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #999;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    color: #333;
}

.modal-body {
    padding: 20px;
}

.modal-footer {
    padding: 20px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.section {
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f0f0f0;
}

.section:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.section h5 {
    color: #333;
    margin-bottom: 15px;
    font-weight: 600;
    border-left: 4px solid #007bff;
    padding-left: 10px;
}

.section p {
    margin-bottom: 8px;
    line-height: 1.5;
}

.section strong {
    color: #555;
    min-width: 120px;
    display: inline-block;
}

.profile-photo {
    max-width: 150px;
    max-height: 150px;
    border-radius: 8px;
    border: 2px solid #ddd;
    margin-top: 5px;
}

.bank-info {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    padding: 10px;
    font-size: 14px;
    white-space: pre-wrap;
    margin-top: 5px;
}

.row {
    margin-left: -15px;
    margin-right: -15px;
}

.col-md-6, .col-12 {
    padding-left: 15px;
    padding-right: 15px;
}

@media (min-width: 768px) {
    .col-md-6 {
        width: 50%;
        float: left;
    }
}

.col-12 {
    width: 100%;
}

.mt-3 {
    margin-top: 1rem;
}

.mr-2 {
    margin-right: 0.5rem;
}
</style>

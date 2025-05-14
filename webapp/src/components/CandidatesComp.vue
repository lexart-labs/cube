<template>
    <div>
        <h2>
            <b>{{ $t('generic.candidates') }}</b>
            <p class="text-right">
                <button
                    id="newCandidateBtn"
                    type="button"
                    @click="openModal"
                    class="btn btn-primary btn-sm"
                    data-toggle="modal"
                    data-target="#candidateModal"
                >
                    {{ $t('Candidates.newCandidate') }}
                </button>
            </p>
        </h2>

        <!-- Search filters -->
        <div class="row mb-3 mt-3">
            <div class="col-md-3">
                <input
                    type="text"
                    class="form-control"
                    v-model="filters.email"
                    placeholder="Search by email"
                    @input="applyFilters"
                >
            </div>
            <div class="col-md-3">
                <select
                    class="form-control"
                    v-model="filters.country"
                    @change="applyFilters"
                >
                    <option value="">All Countries</option>
                    <option value="Uruguay">Uruguay</option>
                    <option value="Brazil">Brazil</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Chile">Chile</option>
                    <option value="Colombia">Colombia</option>
                </select>
            </div>
            <div class="col-md-2">
                <select
                    class="form-control"
                    v-model="filters.position"
                    @change="applyFilters"
                >
                    <option value="">All Positions</option>
                    <option v-for="position in positions" :key="position.id" :value="position.position">
                        {{ position.position }}
                    </option>
                </select>
            </div>
            <div class="col-md-2">
                <select
                    class="form-control"
                    v-model="filters.isBenching"
                    @change="applyFilters"
                >
                    <option value="">All Benching Status</option>
                    <option value="1">Is Benching</option>
                    <option value="0">Not Benching</option>
                </select>
            </div>
            <div class="col-md-2">
                <button
                    class="btn btn-secondary btn-sm"
										style="float: right;"
                    @click="clearFilters"
                >
                    Clear Filters
                </button>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div class="modal" role="dialog" id="deleteConfirmModal" tabindex="-1">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title is-bold">{{ $t('generic.confirmDelete') }}</h5>
                        <button
                            type="button"
                            class="close"
                            data-dismiss="modal"
                            aria-label="Close"
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>{{ $t('Candidates.deleteConfirmation') || 'Are you sure you want to delete this candidate?' }}</p>
                    </div>
                    <div class="modal-footer">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            data-dismiss="modal"
                        >
                            {{ $t("generic.cancel") }}
                        </button>
                        <button
                            type="button"
                            class="btn btn-danger"
                            @click="deleteCandidate()"
                            :disabled="isLoading"
                        >
                            {{ isLoading ? $t('generic.loading') + '...' : $t('generic.delete') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <br>
        <table data-testid="candidatesTable" class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>{{ $t('Candidates.fullName') }}</th>
                    <th>{{ $t('Candidates.email') }}</th>
                    <th>{{ $t('Candidates.country') }}</th>
                    <th>{{ $t('Candidates.phone') }}</th>
                    <th>{{ $t('Candidates.position') }}</th>
                    <th>{{ $t('Candidates.source') }}</th>
                    <th>{{ $t('generic.date') }}</th>
                    <th>{{ $t('Candidates.cv') }}</th>
                    <th>{{ $t('Candidates.isBenching') }}</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, i) in filteredItems" :key="`candidate${i}`">
                    <td>{{ item.id }}</td>
                    <td>{{ item.fullName }}</td>
                    <td style="max-width: 100px; word-break: break-all;">{{ item.email }}</td>
                    <td>{{ item.country }}</td>
                    <td>{{ item.phone }}</td>
                    <td style="max-width: 100px;">{{ item.position }}</td>
                    <td style="max-width: 100px;">{{ item.source }}</td>
                    <td>{{ formatDate(item.dateCreated) }}</td>
                    <td>
                        <a v-if="item.cv" :href="item.cv" target="_blank" class="btn btn-info btn-sm">
                            <i class="fa fa-file-pdf-o"></i> {{ $t('Candidates.viewCV') }}
                        </a>
                    </td>
                    <td>
                        <span v-if="item.isBenching" class="badge badge-success">Yes</span>
                        <span v-else class="badge badge-secondary">No</span>
                    </td>
                    <td>
                        <button @click="getById(item.id)" class="btn btn-secondary candidate_edit_btn btn-sm">
                            {{ $t('generic.edit')}}
                        </button>
                        <button @click="confirmDelete(item.id)" class="btn btn-danger ml-2 btn-sm">
                            {{ $t('generic.delete')}}
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
        <!-- Modal save -->
        <div class="modal" role="dialog" id="candidateModal" ref="candidateModal" tabindex="-1">
            <form id="candidateForm" @submit.prevent="upsertCandidate" class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title is-bold">
                            {{ $t('Candidates.candidate') + ' ' + (selectedId ? selectedId : '') }}
                        </h5>
                        <button
                            type="button"
                            class="close"
                            data-dismiss="modal"
                            aria-label="Close"
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="fullName">{{ $t('Candidates.fullName') }}</label>
                            <input type="text" class="form-control" id="fullName" v-model="candidate.fullName" required>
                        </div>
                        <div class="form-group">
                            <label for="email">{{ $t('Candidates.email') }}</label>
                            <input type="email" class="form-control" id="email" v-model="candidate.email" @input="onEmailChange" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group col-md-6">
                                <label for="country">{{ $t('Candidates.country') }}</label>
                                <select class="form-control" id="country" v-model="candidate.country">
                                    <option value="">{{ $t('Candidates.selectCountry') }}</option>
                                    <option value="Uruguay">Uruguay</option>
                                    <option value="Brazil">Brazil</option>
                                    <option value="Argentina">Argentina</option>
                                    <option value="Chile">Chile</option>
                                    <option value="Colombia">Colombia</option>
                                </select>
                            </div>
                            <div class="form-group col-md-6">
                                <label for="phone">{{ $t('Candidates.phone') }}</label>
                                <input type="text" class="form-control" id="phone" v-model="candidate.phone">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group col-md-4">
                                <label for="englishLevel">{{ $t('Candidates.englishLevel') }}</label>
                                <select class="form-control" id="englishLevel" v-model="candidate.englishLevel">
                                    <option value="None">{{ $t('Candidates.levelNone') }}</option>
                                    <option value="Basic">{{ $t('Candidates.levelBasic') }}</option>
                                    <option value="Intermediate">{{ $t('Candidates.levelIntermediate') }}</option>
                                    <option value="Advanced">{{ $t('Candidates.levelAdvanced') }}</option>
                                    <option value="Native">{{ $t('Candidates.levelNative') }}</option>
                                </select>
                            </div>
                            <div class="form-group col-md-4">
                                <label for="spanishLevel">{{ $t('Candidates.spanishLevel') }}</label>
                                <select class="form-control" id="spanishLevel" v-model="candidate.spanishLevel">
                                    <option value="None">{{ $t('Candidates.levelNone') }}</option>
                                    <option value="Basic">{{ $t('Candidates.levelBasic') }}</option>
                                    <option value="Intermediate">{{ $t('Candidates.levelIntermediate') }}</option>
                                    <option value="Advanced">{{ $t('Candidates.levelAdvanced') }}</option>
                                    <option value="Native">{{ $t('Candidates.levelNative') }}</option>
                                </select>
                            </div>
                            <div class="form-group col-md-4">
                                <label for="portugueseLevel">{{ $t('Candidates.portugueseLevel') }}</label>
                                <select class="form-control" id="portugueseLevel" v-model="candidate.portugueseLevel">
                                    <option value="None">{{ $t('Candidates.levelNone') }}</option>
                                    <option value="Basic">{{ $t('Candidates.levelBasic') }}</option>
                                    <option value="Intermediate">{{ $t('Candidates.levelIntermediate') }}</option>
                                    <option value="Advanced">{{ $t('Candidates.levelAdvanced') }}</option>
                                    <option value="Native">{{ $t('Candidates.levelNative') }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-row">
                                <div class="form-group col-md-6">
                                    <label for="position">{{ $t('Candidates.position') }}</label>
                                    <select class="form-control" id="position" v-model="candidate.position">
                                        <option value="">{{ $t('Candidates.selectPosition') }}</option>
                                        <option v-for="position in positions" :key="position.id" :value="position.position">
                                            {{ position.position }}
                                        </option>
                                    </select>
                                </div>
                                <div class="form-group col-md-6">
                                    <label for="source">{{ $t('Candidates.source') }}</label>
                                    <select class="form-control" id="source" v-model="candidate.source">
                                        <option value="">{{ $t('Candidates.selectSource') }}</option>
                                        <option v-for="origin in origins" :key="origin.id" :value="origin.plataform">
                                            {{ origin.plataform }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <!-- New Developer Dropdown -->
                        <div class="form-group">
                            <label for="developer">{{ $t('Candidates.developer') || 'Developer' }}</label>
                            <select class="form-control" id="developer" v-model="candidate.developer" @change="onDeveloperChange">
                                <option value="">{{ $t('Candidates.selectDeveloper') || 'Select Developer' }}</option>
                                <option v-for="developer in developers" :key="developer.id" :value="developer.id">
                                    {{ developer.name }}
                                </option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="github">{{ $t('Candidates.github') }}</label>
                            <input type="url" class="form-control" id="github" v-model="candidate.github">
                        </div>
                        <div class="form-group">
                            <label for="linkedin">{{ $t('Candidates.linkedin') }}</label>
                            <input type="url" class="form-control" id="linkedin" v-model="candidate.linkedin">
                        </div>
                        <div class="form-group">
                            <label for="cv">{{ $t('Candidates.cv') }}</label>
                            <input type="url" class="form-control" id="cv" v-model="candidate.cv" placeholder="URL to CV">
                        </div>
                        <div class="form-group">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="isBenching" v-model="candidate.isBenching">
                                <label class="form-check-label" for="isBenching">{{ $t('Candidates.isBenching') }}</label>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button
                            type="button"
                            class="btn btn-secondary"
                            data-dismiss="modal"
                        >
                            {{ $t("generic.close") }}
                        </button>
                        <button
                            type="submit"
                            class="btn btn-primary"
                            :disabled="isLoading"
                        >
                            {{ isLoading ? $t('generic.loading') + '...' : (selectedId ? $t('generic.edit') : $t('generic.save')) }}
                        </button>
                    </div>
                </div>
            </form>
        </div>
        <nav v-if="pagesLength" class="pages-nav">
            <span
                v-on:click="navigate('-')"
                :class="page == 1 ? 'not-allowed' : ''"
            >
                {{ $t('generic.back') }}
            </span>
            <span
                v-for="index in pagesLength"
                :key="index"
                :class="page == index ? 'current' : ''"
                v-on:click="navigate(index)"
            >
                {{ index }}
            </span>
            <span
                v-on:click="navigate('+')"
                :class="page == pagesLength ? 'not-allowed' : ''"
            >
                {{ $t('generic.next') }}
            </span>
        </nav>
        <div class="window-centered">
            <Spinner v-if="isLoading" />
        </div>
    </div>
</template>
<script>
    import CandidateService from '@/services/candidate.service.js';
    import Spinner from '../components/Spinner.vue';
    import axios from 'axios';
    import { APP_NAME, API } from '../../env';

    export default {
        components: {
            Spinner
        },
        data() {
            return {
                selectedId: '',
                page: 0,
                pagesLength: 0,
                isLoading: false,
                searchQuery: '',
                items: [],
                filteredItems: [],
                positions: [],
                origins: [],
                developers: [], // Add developers array
                filters: {
                    email: '',
                    country: '',
                    position: '',
                    isBenching: ''
                },
                candidate: {
                    fullName: '',
                    email: '',
                    country: '',
                    phone: '',
                    englishLevel: 'None',
                    spanishLevel: 'None',
                    portugueseLevel: 'None',
                    source: '',
                    position: '',
                    github: '',
                    linkedin: '',
                    cv: '',
                    isBenching: false,
                    developer: '' // Add developer field to candidate object
                }
            };
        },
        async mounted() {
            await this.paginate();
            this.loadTotalPages();
            this.fetchPositions();
            this.fetchOrigins();
            this.fetchDevelopers(); // Add call to fetch developers

            // Fix modal accessibility issues
            $('#candidateModal').on('show.bs.modal', () => {
                $('#candidateModal').removeAttr('aria-hidden');
            });

            $('#candidateModal').on('hidden.bs.modal', () => {
                $('#candidateModal').attr('aria-hidden', 'true');
            });
        },
        methods: {
            generateHeader() {
                const token = localStorage.getItem(`token-app-${APP_NAME}`);
                const userId = localStorage.getItem(`id-${APP_NAME}`);
                const company_slug = localStorage.getItem('_company-slug');

                return { token, 'user-id': userId, company_slug };
            },

            async fetchPositions() {
                try {
                    const headers = this.generateHeader();
                    const response = await axios.get(`${API}careers/byCompany`, { headers });
                    if (response.data && response.data.response) {
                        this.positions = response.data.response;
                    }
                } catch (error) {
                    console.error('Error fetching positions:', error);
                }
            },

            async fetchOrigins() {
                try {
                    const headers = this.generateHeader();
                    const response = await axios.get(`${API}plataforms`, { headers });
                    if (response.data && response.data.response) {
                        this.origins = response.data.response;
                    }
                } catch (error) {
                    console.error('Error fetching origins:', error);
                }
            },
            formatDate(dateString) {
                const date = new Date(dateString);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            },
            async getById(id) {
                this.selectedId = id;
                this.isLoading = true;
                CandidateService().getById(id, ({ response }) => {
                    this.candidate = response;
                    this.isLoading = false;
                    $('#candidateModal').modal('show');
										this.onEmailChange();
                });
            },
            navigate(operator) {
                if (typeof operator === 'number') {
                    this.page = operator;
                } else {
                    operator === '+' ? this.page += 1 : this.page -= 1;
                }
                this.paginate(this.page - 1);
            },
            async loadTotalPages() {
                const { data: totalOfPages } = await CandidateService().getPagesLength();
                this.pagesLength = !totalOfPages.error ? totalOfPages.response : '';
            },
            paginate: async function (page = 0) {
                this.isLoading = true;
                this.items = [];
                this.page = page + 1;
                const { data: res } = await CandidateService().all(page, this.searchQuery);
                if (!res.error) {
                    const items = res.response;
                    this.items = items;
                    this.filteredItems = [...items]; // Initialize filtered items
                } else {
                    this.$toasted.show('Error when trying to get candidates, refresh your screen to try again', {
                        type: 'error',
                        duration: 5000,
                    });
                    this.error = res.error;
                }
                this.isLoading = false;
            },
            applyFilters() {
                this.filteredItems = this.items.filter(item => {
                    const emailMatch = !this.filters.email ||
                        item.email.toLowerCase().includes(this.filters.email.toLowerCase());

                    const countryMatch = !this.filters.country ||
                        item.country === this.filters.country;

                    const positionMatch = !this.filters.position ||
                        item.position === this.filters.position;

                    const benchingMatch = this.filters.isBenching === '' ||
                        (this.filters.isBenching == 1 && item.isBenching == 1) ||
                        (this.filters.isBenching == 0 && (item.isBenching == 0 || item.isBenching === undefined));

                    return emailMatch && countryMatch && positionMatch && benchingMatch;
                });
            },

            clearFilters() {
                this.filters = {
                    email: '',
                    country: '',
                    position: '',
                    isBenching: ''
                };
                this.filteredItems = [...this.items];
            },
            upsertCandidate: function () {
                this.isLoading = true;
                CandidateService().upsert({ ...this.candidate, id: this.selectedId }, async () => {
                    this.isLoading = false;
                    await this.paginate(0);
                    this.loadTotalPages();
                    this.closeModal(); // Use the new method instead of directly hiding
                    this.$toasted.show(this.selectedId ? 'Candidate updated successfully' : 'Candidate created successfully', {
                        type: 'success',
                        duration: 3000,
                    });
                    this.resetCandidate();
                });
            },
            resetCandidate() {
                this.candidate = {
                    fullName: '',
                    email: '',
                    country: '',
                    phone: '',
                    englishLevel: 'None',
                    spanishLevel: 'None',
                    portugueseLevel: 'None',
                    source: '',
                    position: '',
                    github: '',
                    linkedin: '',
                    cv: ''
                };
            },
            closeModal: function() {
                $('#candidateModal').modal('hide');
            },
            async fetchDevelopers() {
                try {
                    const headers = this.generateHeader();
                    const response = await axios.get(`${API}users/all`, { headers });
                    if (response.data && response.data.response) {
                        this.developers = response.data.response;
                    }
                } catch (error) {
                    console.error('Error fetching developers:', error);
                }
            },

            onDeveloperChange() {
                if (this.candidate.developer) {
                    // Find the selected developer in the developers array
                    const selectedDeveloper = this.developers.find(dev => dev.id === this.candidate.developer);
                    if (selectedDeveloper && selectedDeveloper.email) {
                        // Update the email field with the developer's email
                        this.candidate.email = selectedDeveloper.email;
                    }
                }
            },

            onEmailChange() {
                // Check if the entered email matches any developer's email
                if (this.candidate.email && this.developers.length > 0) {
                    const matchingDeveloper = this.developers.find(dev =>
                        dev.email && dev.email.toLowerCase() === this.candidate.email.toLowerCase()
                    );

                    if (matchingDeveloper) {
                        // If a match is found, set the developer dropdown to that developer
                        this.candidate.developer = matchingDeveloper.id;
                    }
                }
            },

            openModal() {
                this.selectedId = '';
                this.candidate = {
                    fullName: '',
                    email: '',
                    country: '',
                    phone: '',
                    englishLevel: 'None',
                    spanishLevel: 'None',
                    portugueseLevel: 'None',
                    source: '',
                    position: '',
                    github: '',
                    linkedin: '',
                    cv: '',
                    isBenching: false,
                    developer: ''
                };
								this.resetCandidate();
            },
            confirmDelete(id) {
                this.selectedId = id;
                $('#deleteConfirmModal').modal('show');
            },
            async deleteCandidate() {
                this.isLoading = true;
                try {
                    const headers = this.generateHeader();
                    const response = await axios.delete(`${API}candidates/${this.selectedId}`, { headers });

                    if (response.data && !response.data.error) {
                        this.$toasted.show('Candidate deleted successfully', {
                            type: 'success',
                            duration: 3000,
                        });

                        // Close modal and refresh data
                        $('#deleteConfirmModal').modal('hide');
                        await this.paginate(this.page - 1);
                        this.loadTotalPages();
                    } else {
                        this.$toasted.show('Error deleting candidate', {
                            type: 'error',
                            duration: 5000,
                        });
                    }
                } catch (error) {
                    console.error('Error deleting candidate:', error);
                    this.$toasted.show('Error deleting candidate', {
                        type: 'error',
                        duration: 5000,
                    });
                }
                this.isLoading = false;
            },
        }
    };
</script>

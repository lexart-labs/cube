<template>
    <div>
        <h2>
            <b>{{ $t('generic.partners') }}</b>
            <p class="text-right">
                <button
                    id="newPartnerBtn"
                    type="button"
                    @click="openModal"
                    class="btn btn-primary btn-sm"
                    data-toggle="modal"
                    data-target="#partnerModal"
                >
                    {{ $t('Partners.newPartner') }}
                </button>
								<button
										style="margin-left: 0.5rem;"
                    id="sendPartnerBtn"
                    type="button"
                    @click="sendPromotion"
                    class="btn btn-success btn-sm"
                >
                    {{ $t('Partners.sendPartner') }}
                </button>
            </p>
        </h2>

        <!-- Search filters -->
        <div class="row mb-3 mt-3">
            <div class="col-md-4">
                <input
                    type="text"
                    class="form-control"
                    v-model="filters.name"
                    placeholder="Search by name"
                    @input="applyFilters"
                >
            </div>
            <div class="col-md-4">
                <input
                    type="text"
                    class="form-control"
                    v-model="filters.email"
                    placeholder="Search by email"
                    @input="applyFilters"
                >
            </div>
            <div class="col-md-4">
                <button
                    class="btn btn-secondary btn-sm"
                    style="float: right;"
                    @click="clearFilters"
                >
                    Clear Filters
                </button>
            </div>
        </div>

        <br>
        <table data-testid="partnersTable" class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>{{ $t('Partners.name') }}</th>
                    <th>{{ $t('Partners.email') }}</th>
                    <th>{{ $t('Partners.membershipLevel') }}</th>
                    <th>{{ $t('Partners.skills') || 'Skills' }}</th>
                    <th>{{ $t('Partners.priceRules') }}</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, i) in filteredItems" :key="`partner${i}`">
                    <td>{{ item.id }}</td>
                    <td>{{ item.name }}</td>
                    <td style="max-width: 100px; word-break: break-all;">{{ item.email }}</td>
                    <td>{{ item.membershipLevel || 'Basic' }}</td>
                    <td>
                        <ul class="list-unstyled">
                            <li v-for="(skill, index) in item.skills" :key="`skill-list-${index}`">
                                {{ skill }}
                            </li>
                            <li v-if="!item.skills || item.skills.length === 0">No skills specified</li>
                        </ul>
                    </td>
                    <td>
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Position</th>
                                    <th>Price per hour</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(rule, index) in item.priceRules" :key="index">
                                    <td>{{ rule.position }}</td>
                                    <td>{{ rule.price }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
										<td>
												<button @click="getById(item.id)" class="btn btn-secondary partner_edit_btn btn-sm">
														{{ $t('generic.edit')}}
												</button>
												<button @click="confirmDelete(item.id, item.name)" class="btn btn-danger ml-2 btn-sm">
														{{ $t('generic.delete')}}
												</button>
										</td>
                </tr>
            </tbody>
        </table>

        <!-- Modal for creating/editing partners -->
        <div class="modal" role="dialog" id="partnerModal" ref="partnerModal" tabindex="-1">
            <form id="partnerForm" @submit.prevent="upsertPartner" class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title is-bold">
                            {{ $t('Partners.partner') + ' ' + (selectedId ? selectedId : '') }}
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
                            <label for="name">{{ $t('Partners.name') }}</label>
                            <input type="text" class="form-control" id="name" v-model="partner.name" required>
                        </div>
                        <div class="form-group">
                            <label for="email">{{ $t('Partners.email') }}</label>
                            <input type="email" class="form-control" id="email" v-model="partner.email" required>
                        </div>

                        <div class="form-group">
                            <label for="membershipLevel">{{ $t('Partners.membershipLevel') }}</label>
                            <select class="form-control" id="membershipLevel" v-model="partner.membershipLevel" required>
                                <option value="Basic">Basic</option>
                                <option value="Startup">Startup</option>
                                <option value="Platinum">Platinum</option>
                                <option value="Enterprise Black">Enterprise Black</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>{{ $t('Partners.priceRules') }}</label>
                            <div v-for="(rule, index) in partner.priceRules" :key="index" class="form-row mb-2">
                                <div class="col-md-6">
                                    <select class="form-control" v-model="rule.position">
                                        <option value="">Select Position</option>
                                        <option v-for="position in positions" :key="position.position" :value="position.position">
                                            {{ position.position }}
                                        </option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <input type="number" class="form-control" v-model="rule.price" placeholder="Price per hour">
                                </div>
                                <div class="col-md-2">
                                    <button type="button" class="btn btn-danger" @click="removePriceRule(index)">
                                        <i class="fa fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <button type="button" class="btn btn-secondary" @click="addPriceRule">
                                {{ $t('Partners.addPriceRule') }}
                            </button>
                        </div>
                        <div class="form-group">
                            <label>{{ $t('Partners.skills') || 'Required Skills' }}</label>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Skill</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(skill, index) in partner.skills" :key="`skill-${index}`">
                                            <td>
                                                <select class="form-control" v-model="partner.skills[index]">
                                                    <option value="">Select Skill</option>
                                                    <option v-for="skillOption in skillOptions" :key="skillOption" :value="skillOption">
                                                        {{ skillOption }}
                                                    </option>
                                                </select>
                                            </td>
                                            <td>
                                                <button type="button" class="btn btn-danger btn-sm" @click="removeSkill(index)">
                                                    <i class="fa fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <button type="button" class="btn btn-secondary" @click="addSkill">
                                {{ $t('Partners.addSkill') || 'Add Skill' }}
                            </button>
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
												<p>{{ $t('Partners.confirmDeleteMessage') }} <strong>{{ partnerToDelete.name }}</strong>?</p>
												<p class="text-danger">{{ $t('generic.thisActionCantBeUndone') }}</p>
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
														@click="deletePartner"
														:disabled="isLoading"
												>
														{{ isLoading ? $t('generic.loading') + '...' : $t('generic.delete') }}
												</button>
										</div>
								</div>
						</div>
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
import PartnerService from '@/services/partner.service.js';
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
            filters: {
                name: '',
                email: ''
            },
            partner: {
                name: '',
                email: '',
                membershipLevel: 'Basic', // Default value
                priceRules: [],
                skills: [] // Add skills array
            },
            partnerToDelete: {
                id: null,
                name: ''
            },
            positions: [
                'Frontend Developer',
                'Backend Developer',
                'Full Stack Developer',
                'UI/UX Designer',
                'DevOps Engineer',
                'QA Engineer',
                'Project Manager',
                'Product Manager',
                'Data Scientist',
                'Mobile Developer'
            ],
            // Add the skillOptions array here
            skillOptions: [
                'React/Node',
                'React Native',
                'Vue/Node',
                'Laravel/PHP',
                'DevOps/AWS/Azure',
                'DevSecOps'
            ]
        };
    },
    async mounted() {
        await this.paginate();
        this.loadTotalPages();
        this.loadPositions();
    },
    methods: {
        generateHeader() {
            const token = localStorage.getItem(`token-app-${APP_NAME}`);
            const userId = localStorage.getItem(`id-${APP_NAME}`);
            const company_slug = localStorage.getItem('_company-slug');

            return { token, 'user-id': userId, company_slug };
        },
        async loadPositions() {
            try {
								const headers = this.generateHeader();
								const response = await axios.get(`${API}careers/byCompany`, { headers });
								if (response.data && response.data.response) {
										this.positions = response.data.response;
								}
            } catch (error) {
                console.error('Error loading positions:', error);
            }
        },
        addPriceRule() {
            this.partner.priceRules.push({
                position: '',
                price: 0
            });
        },
        removePriceRule(index) {
            this.partner.priceRules.splice(index, 1);
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
            PartnerService().getById(id, ({ response }) => {
                this.partner = response;
                this.isLoading = false;
                $('#partnerModal').modal('show');
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
            const { data: totalOfPages } = await PartnerService().getPagesLength();
            this.pagesLength = !totalOfPages.error ? totalOfPages.response : '';
        },
        async paginate(page = 0) {
            this.isLoading = true;
            this.items = [];
            this.page = page + 1;
            const { data: res } = await PartnerService().all(page, this.searchQuery);
            this.items = res.response;
            this.filteredItems = this.items;
            this.isLoading = false;
        },
        applyFilters() {
            this.filteredItems = this.items.filter(item => {
                return (!this.filters.name || item.name.toLowerCase().includes(this.filters.name.toLowerCase())) &&
                       (!this.filters.email || item.email.toLowerCase().includes(this.filters.email.toLowerCase()));
            });
        },
        clearFilters() {
            this.filters = {
                name: '',
                email: ''
            };
            this.applyFilters();
        },
        sendPromotion() {
          // Get all candidates that are in benching
          this.isLoading = true;

          const headers = this.generateHeader();
          axios.get(`${API}candidates`, { headers })
            .then(response => {
              const benchingCandidates = response.data.response || [];

              // Get all partners with their price rules
              PartnerService().all(0, '')
                .then(({ data }) => {
                  const partners = data.response || [];
                  const matches = {};

                  // For each partner, find matching candidates based on price rules and skills
                  partners.forEach(partner => {
                    const matchingCandidates = [];

                    // Check each candidate against partner's price rules and skills
                    benchingCandidates.forEach(candidate => {
                      // Check if candidate has a principal stack that matches any of the partner's skills
                      const skillMatch = !partner.skills || partner.skills.length === 0 ||
                                    (candidate.principalStack && partner.skills.includes(candidate.principalStack));

                      // Check position match as before
                      partner.priceRules.forEach(rule => {
                        if (candidate.position === rule.position && candidate.isBenching == 1 && skillMatch) {
                          matchingCandidates.push({
                            id: candidate.id,
                            name: candidate.fullName,
                            position: candidate.position,
                            principalStack: candidate.principalStack || 'Not specified',
                            price: rule.price,
                            cv: candidate.cv,
                          });
                        }
                      });
                    });

                    if (matchingCandidates.length > 0) {
                      matches[partner.id] = {
                        matchingCandidates: matchingCandidates,
                        partnerId: partner.id,
                        partnerEmail: partner.email,
                        partnerName: partner.name,
                        membershipLevel: partner.membershipLevel,
                        skills: partner.skills || []
                      };
                    }
                  });

                  // Log the matches
                  console.log('Partner-Candidate Matches:', matches);

                  // Send matches to backend for email processing
                  if (Object.keys(matches).length > 0) {
                    axios.post(`${API}partners/send-matches`, matches, { headers })
                      .then(response => {
                        console.log('Email sending result:', response.data);
                        this.$toasted.success('Partner match emails sent successfully!');
                        this.isLoading = false;
                      })
                      .catch(error => {
                        console.error('Error sending partner match emails:', error);
                        this.$toasted.error('Failed to send partner match emails');
                        this.isLoading = false;
                      });
                  } else {
                    console.log('No matches found to send');
                    this.$toasted.info('No matching candidates found for any partners');
                    this.isLoading = false;
                  }
                })
                .catch(error => {
                  console.error('Error getting partners:', error);
                  this.$toasted.error('Failed to get partners');
                  this.isLoading = false;
                });
            })
            .catch(error => {
              console.error('Error getting candidates:', error);
              this.$toasted.error('Failed to get candidates');
              this.isLoading = false;
            });
        },
        addSkill() {
            if (!this.partner.skills) {
                this.partner.skills = [];
            }
            this.partner.skills.push('');
        },
        removeSkill(index) {
            this.partner.skills.splice(index, 1);
        },
        openModal() {
            this.selectedId = '';
            this.partner = {
                name: '',
                email: '',
                priceRules: [{
                    position: '',
                    price: 0
                }],
                skills: [] // Initialize empty skills array
            };
        },
        async upsertPartner() {
            this.isLoading = true;
            try {
                if (this.selectedId) {
                    await PartnerService().update(this.selectedId, this.partner);
                } else {
                    await PartnerService().create(this.partner);
                }
                await this.paginate(this.page - 1);
                $('#partnerModal').modal('hide');
            } catch (error) {
                console.error('Error saving partner:', error);
            } finally {
                this.isLoading = false;
            }
        },
        confirmDelete(id, name) {
            this.partnerToDelete = {
                id: id,
                name: name
            };
            $('#deleteConfirmModal').modal('show');
        },
        async deletePartner() {
            this.isLoading = true;
            try {
                await PartnerService().delete(this.partnerToDelete.id);
                this.$toasted.success(this.$t('Partners.deleteSuccess'));
                await this.paginate(this.page - 1);
                $('#deleteConfirmModal').modal('hide');
            } catch (error) {
                console.error('Error deleting partner:', error);
                this.$toasted.error(this.$t('Partners.deleteError'));
            } finally {
                this.isLoading = false;
            }
        },
    }
};
</script>

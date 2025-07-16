<template>
    <div>
        <h2>
            <b>{{ $t('generic.burnOut') }}</b>
            <p class="text-right">
                <button
                    id="newTestBtn"
                    type="button"
                    @click="openModal"
                    :disabled="isNewTestDisabled"
                    class="btn btn-primary btn-sm"
                    data-toggle="modal"
                    data-target="#testModal"
                    :title="$t('UserBurnoutTest.maxOneTestPerMonth')"
                >
                    {{ $t('UserBurnoutTest.newTest') }}
                </button>
            </p>
        </h2>
        <br>
        <table data-testid="burnoutTable" class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>
                        <span data-toggle="tooltip" data-placement="top" :title="$t('UserBurnoutTest.tooltipScore') + ' 26'">
                            {{ $t('UserBurnoutTest.scoreTired') }}
                        </span>
                    </th>
                    <th>
                        <span data-toggle="tooltip" data-placement="top" :title="$t('UserBurnoutTest.tooltipScore') + ' 9'">
                            {{ $t('UserBurnoutTest.scoreDepersonalization') }}
                        </span>
                    </th>
                    <th>
                        <span data-toggle="tooltip" data-placement="top" :title="$t('UserBurnoutTest.tooltipScore') + ' 34'">
                            {{ $t('UserBurnoutTest.scoreRealization') }}
                        </span>
                    </th>
                    <th> {{ $t('generic.date') }}  </th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, i) in items" :key="`test${i}`">
                    <td>{{ item.id }}</td>
                    <td>{{ item.scoreTired }}</td>
                    <td>{{ item.scoreDepersonalization }}</td>
                    <td>{{ item.scoreRealization }} </td>
                    <td>{{ formatDate(item.dateCreated) }}</td>
                    <td>
                        <button @click="getById(item.id)" class="btn btn-secondary burnout_edit_btn">
                            {{ $t('generic.seeDetails')}}
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
        <!-- Modal save -->
        <div class="modal" role="dialog" id="testModal" ref="testModal">
            <form id="testForm" @submit.prevent="upsertTest" class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title is-bold">
                            {{ $t('generic.burnOut') + ' ' +  selectedId }}
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
                        <div class="mb-3 dropdown">
                            <button class="btn btn-secondary mb-1 dropdown-toggle" id="dropdownBurnoutTest" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                {{ $t('UserBurnoutTest.rangesTitle' )}}
                            </button>
                            <ul v-show="showList" class="dropdown-menu py-0 shadow-lg" aria-labelledby="dropdownBurnoutTest">
                                <li class="list-group-item">0 = {{ $t('UserBurnoutTest.ranges0' ) }}</li>
                                <li class="list-group-item">1 = {{ $t('UserBurnoutTest.ranges1' ) }}</li>
                                <li class="list-group-item">2 = {{ $t('UserBurnoutTest.ranges2' ) }}.</li>
                                <li class="list-group-item">3 = {{ $t('UserBurnoutTest.ranges3' ) }}</li>
                                <li class="list-group-item">4 = {{ $t('UserBurnoutTest.ranges4' ) }}</li>
                                <li class="list-group-item">5 = {{ $t('UserBurnoutTest.ranges5') }}</li>
                                <li class="list-group-item">6 = {{ $t('UserBurnoutTest.ranges6' ) }}</li>
                            </ul>
                        </div>
                        <table class="table">
                            <tbody>
                                <tr v-for="(qn, i) in questions" :key="i">
                                    <td>{{ $t('UserBurnoutTest.' + qn.q) }}</td>
                                    <td>
                                        <select class="form-control burnout-select burnout_score" v-model="qn.value">
                                            <option value="0">0</option>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                            <option value="4">4</option>
                                            <option value="5">5</option>
                                            <option value="6">6</option>
                                        </select>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button
                            type="button"
                            v-on:click="teamName = ''"
                            class="btn btn-secondary"
                            data-dismiss="modal"
                        >
                            {{ $t("generic.close") }}
                        </button>
                        <button
                            type="submit"
                            class="btn btn-primary"
                            :disabled="isLoading || isSaveDisabled"
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
    import BurnoutTestService from '@/services/burnoutTest.service.js';
    import Spinner from '../components/Spinner.vue';
    export default {
        components: {
            Spinner
        },
        data() {
            return {
                isSaveDisabled: true,
                isNewTestDisabled: true,
                selectedId: '',
                page: 0,
                pagesLength: 0,
                isLoading: false,
                showList: false,
                showNewTest: false,
                searchQuery: '',
                items: [],
                questions: [
                    {q: 'q0', value: 0},
                    {q: 'q1', value: 0},
                    {q: 'q2', value: 0},
                    {q: 'q3', value: 0},
                    {q: 'q4', value: 0},
                    {q: 'q5', value: 0},
                    {q: 'q6', value: 0},
                    {q: 'q7', value: 0},
                    {q: 'q8', value: 0},
                    {q: 'q9', value: 0},
                    {q: 'q10', value: 0},
                    {q: 'q11', value: 0},
                    {q: 'q12', value: 0},
                    {q: 'q13', value: 0},
                    {q: 'q14', value: 0},
                    {q: 'q15', value: 0},
                    {q: 'q16', value: 0},
                    {q: 'q17', value: 0},
                    {q: 'q18', value: 0},
                    {q: 'q19', value: 0},
                    {q: 'q20', value: 0},
                    {q: 'q21', value: 0},
                ]
            };
        },
        async mounted() {
            $('[data-toggle="tooltip"]').tooltip()
            await this.paginate();
            this.checkNewTestAvailable();
            this.checkTestDoneLastThreeMonths();
            this.loadTotalPages();
        },
        methods: {
            checkTestDoneLastThreeMonths() {
                let isTestDoneInLastThreeMonths = false;
                if (this.items.length) {
                    const firstTest = this.items[0];
                    const firstTestDate = new Date(firstTest.dateCreated);
                    const threeMonthsAgo = new Date();
                    threeMonthsAgo.setUTCMonth(threeMonthsAgo.getUTCMonth() - 3);
                    isTestDoneInLastThreeMonths = firstTestDate >= threeMonthsAgo;
                }
                this.$emit('isTestDoneInLastThreeMonths', isTestDoneInLastThreeMonths)
            },
            checkTestCurrentMonth(test) {
                const currentYear = new Date().getUTCFullYear()
                const currentMonth = new Date().getUTCMonth() + 1;
                return test && test.month == currentMonth && test.year == currentYear;
            },
            checkNewTestAvailable() {
                const firstTest = this.items[0];
                this.isNewTestDisabled = this.checkTestCurrentMonth(firstTest);
                if(this.isNewTestDisabled) $('#newTestBtn').tooltip();
                else $('#newTestBtn').tooltip('dispose');
            },
            formatDate(dateString) {
                const date = new Date(dateString);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed in JavaScript
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            },
            async getById(id) {
                this.selectedId = id;
                BurnoutTestService().getById(id, ({ response }) => {
                    const value = response.value;
                    this.questions = this.questions.map((qn, i) => {
                        qn.value = value[i];
                        return qn;
                    });
                    this.isSaveDisabled = !this.checkTestCurrentMonth(response);
                    $('#testModal').modal('show');
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
                const { data: totalOfPages } = await BurnoutTestService().getPagesLength();
                this.pagesLength = !totalOfPages.error ? totalOfPages.response : '';
            },
            paginate: async function (page = 0, isCreatingNewEvaluation = false) {
                this.isLoading = true;
                this.items = [];
                this.page = page + 1;
                const { data: res } = await BurnoutTestService().all(page, this.searchQuery);
                if (!res.error) {
                    const items = res.response;
                    this.items = items;
                } else {
                    this.$toasted.show('Error when trying to get the burnout tests, refresh your screen to try again', {
                        type: 'error',
                        duration: 5000,
                    });
                    this.error = res.error;
                }
                this.isLoading = false;
            },
            upsertTest: function () {
                const value = this.questions.map(qn => parseInt(qn.value));
                this.isLoading = true;
                BurnoutTestService().upsert({ value, id: this.selectedId }, async () => {
                    this.isLoading = false;
                    // Close Modal After It's saved.
                    await this.paginate(0);
                    this.checkNewTestAvailable();
                    this.loadTotalPages();
                    $('#testModal').modal('hide');

                    // New test done, disable warning.
                    if(!this.selectedId) {
                        this.$emit('isTestDoneInLastThreeMonths', true)
                    }
                })
            },
            resetTest() {
                this.questions = this.questions.map(qn => {
                    qn.value = 0;
                    return qn;
                });
            },
            openModal: function (){
                this.selectedId = '';
                this.showNewTest = true
                this.isSaveDisabled = false;
                this.resetTest()
            }
        }
    };
</script>

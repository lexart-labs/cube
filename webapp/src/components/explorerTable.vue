<template>
  <div class="admin-conteiner" style="margin-top: 1rem">
    <header class="header-table">
      <h4 class="is-bold">
        {{ $t(`${translations}.title`) }}
      </h4>
      <button
          type="button"
          class="btn btn-success"
          data-toggle="modal"
          :data-target="modalId"
          v-on:click="onNew"
        >
          + {{$t(`${translations}.newBtn`)}}
      </button>
    </header>
    <input
      type="search"
      :placeholder="$t(`${translations}.searchPlaceholder`)"
      v-model="searchQuery"
      class="form-control is-rounded search"
    />
    <div>
      <table class="table table-admin col-12">
        <thead class="is-bold">
          <tr>
            <th v-for="(header, i) in $t(`${translations}.headers`)" :key="`head${i}`">
              {{ header }}
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in tableEntries" :key="`row${i}`">
            <td v-for="(key,j) in tableKeys" :key="`entry${j}`">
              {{ item[key] }}
            </td>
            <td>
              <button
                class="btn btn-primary col-12"
                v-on:click="onEdit(item.id)"
                data-toggle="modal"
                :data-target="modalId"
              >
                {{$t('generic.edit')}}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <nav class="pages-nav">
        <span
          v-on:click="navigate('-')"
          :class="page == 1 ? 'not-allowed' : ''"
        >
          Back
        </span>
        <span
          v-for="index in pagesLength"
          :class="page == index ? 'current' : ''"
          :key="index"
          v-on:click="navigate(index)"
        >
          {{ index }}
        </span>
        <span
          v-on:click="navigate('+')"
          :class="page == pagesLength ? 'not-allowed' : ''"
        >
          Next
        </span>
      </nav>
    </div>
    <div class="window-centered">
      <Spinner v-if="isLoading" />
    </div>
  </div>
</template>

<script>
import Spinner from './Spinner.vue';

export default {
  name: 'ExplorerTable',
  components: { Spinner },
  props: {
    translations: String,
    tableKeys: Array,
    modalId: String,
    tableData: Array,
    onNew: Function,
    onEdit: Function,
    pager: Function,
    pagesCount: Number,
  },
  data() {
    return {
      error: '',
      searchQuery: '',
      tableEntries: this.tableData,
      isLoading: false,
      page: 1,
      pagesLength: this.pagesCount,
    };
  },
  methods: {
    navigate(operator) {
      if (typeof operator === 'number') {
        this.page = operator;
      } else {
        operator === '+' ? this.page += 1 : this.page -= 1;
      }

      this.paginate(this.page - 1);
    },
    paginate: async function (page = 0) {
      this.isLoading = true;
      this.tableEntries = [];
      this.page = page + 1;
      const { data: res } = await this.pager(page);

      if (!res.error) {
        this.tableEntries = res.response;

      } else {
        this.$toasted.show('Error when trying to get data, refresh your screen to try again', {
          type: 'error',
          duration: 3000,
        });
        this.error = res.error;
      }

      this.isLoading = false;
    },
  },
}
</script>
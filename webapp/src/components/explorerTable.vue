<template>
  <div class="admin-conteiner" style="margin-top: 1rem">
    <header class="header-table">
      <h4 class="is-bold">
        {{ $t(`${translations}.title`) }}
      </h4>
      <div>
        <button
          type="button"
          class="btn btn-success"
          data-toggle="modal"
          :data-target="modalId"
          v-on:click="onNew"
          style="margin-right: 0.6rem;"
        >
          + {{$t(`${translations}.newBtn`)}}
        </button>
        <button class="btn btn-primary" disabled="disabled">
          {{ $t('generic.import')}} CSV
        </button>
      </div>
    </header>
    <slot name="filters"></slot>
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

    <!-- Modais -->
    <slot name="upsert-modal"></slot>
  </div>
</template>

<script>
import Spinner from './Spinner.vue';

export default {
  name: 'ExplorerTable',
  components: { Spinner },
  watch: {
    pagesCount: function (o, n) {
      this.pagesLength = o;
    },
    actualPage: function () {
      this.page = this.actualPage + 1;
    }
  },
  props: {
    translations: String,
    tableKeys: Array,
    modalId: String,
    tableData: Array,
    onNew: Function,
    onEdit: Function,
    pager: Function,
    pagesCount: Number,
    actualPage: Number
  },
  data() {
    return {
      error: '',
      searchQuery: '',
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
      this.page = page + 1;
      await this.pager(page);

      this.isLoading = false;
    },
  },
  computed: {
    tableEntries() {
      return this.tableData;
    },
  },
}
</script>
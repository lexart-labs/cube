import BurnOutComp from "@/components/BurnOutComp.vue";
import { shallowMount } from "@vue/test-utils";
import localVue from "../../localVue";

jest.mock("@/services/burnoutTest.service.js", () => {
  // Test entries to be displayed in the burnout test table.
  let entries = [
    {
      id: 1,
      score: 12,
      value: [5, 0, 0, 7],
      dateCreated: "2021-01-01",
    },
  ];

  // Mockup implementation for the burnoutTestService.
  return jest.fn().mockImplementation(() => {
    return {
      getById: jest.fn((id, cb) => (cb({ response: entries.find((el) => el.id === id) }))),
      all: jest.fn(() => {
        entries.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
        return {
          data: {
            response: entries,
          }
        }
      }),
      upsert: jest.fn((item, cb) => {
        item.score = item.value.reduce((a, b) => a + b, 0);
        if (item.id) {
          entries = entries.map((el) => (el.id === item.id ? item : el));
        } else {
          item.id = entries.at(-1).id + 1;
          item.dateCreated = new Date().toISOString();
          entries.push(item);
        }
        return cb(true);
      }),
      getPagesLength: jest.fn(() => ({
        data: {
          response: 1,
        },
      })),
    };
  });
});

describe("BurnOutComp", () => {
  // Verify all tests are displayed on load.
  it("Tests are displayed in the table", async () => {
    const wrapper = shallowMount(BurnOutComp, { localVue });
    // Wait for component to be mounted.
    await wrapper.vm.$nextTick();
    // Wait for render after pagination.
    await wrapper.vm.$nextTick();
    const tbody = wrapper.find('[data-testid="burnoutTable"] tbody');
    const rows = tbody.findAll("tr");
    expect(rows.length).toBeGreaterThan(0);
  });

  // Verify that a new test can be created and it's displayed at the top of the table with the correct score.
  it("Create a new test", async () => {
    const wrapper = shallowMount(BurnOutComp, { localVue });
    let scorePerEntry = 5;
    const selectors = wrapper.findAll('select.burnout_score');
    let totalScore = selectors.length * scorePerEntry;
    for (let i = 0; i < selectors.length; i++) {
      const select = selectors.at(i);
      const options = select.findAll("option");
      options.at(scorePerEntry).setSelected();
    }
    await wrapper.find("#testForm").trigger("submit.prevent");
    await wrapper.vm.$nextTick();
    // Debug html output
    const tbody = wrapper.find('[data-testid="burnoutTable"] tbody');
    const rows = tbody.findAll("tr");
    const score = rows.at(0).findAll("td").at(1).text();
    expect(score).toBe(totalScore.toString());
  });

  it('See entry details',  async() => {
    const itemIndex = 0;
    const wrapper = shallowMount(BurnOutComp, { localVue });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    let tbody = wrapper.find('[data-testid="burnoutTable"] tbody');
    // Find first entry in the table.
    const rows = tbody.findAll("tr");
    const row = rows.at(itemIndex);
    // Click on the edit button for that entry.
    const editButton = row.find('button.burnout_edit_btn');
    await editButton.trigger('click');
    await wrapper.vm.$nextTick();
    const selectors = wrapper.findAll('select.burnout_score');
    let totalScore = 0;
    for (let i = 0; i < selectors.length; i++) {
      const select = selectors.at(i);
      const selectedOptionValue = select.element.value;
      totalScore += parseInt(selectedOptionValue);
    }
    // Expect totalScore captured from the form to be equal to the score of the entry.
    expect(totalScore).toBe(wrapper.vm.items[itemIndex].score);
  })

  it('Modify an existing entry',  async() => {
    const wrapper = shallowMount(BurnOutComp, { localVue });
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    let tbody = wrapper.find('[data-testid="burnoutTable"] tbody');
    const rows = tbody.findAll("tr");
    const row = rows.at(0);
    const editButton = row.find('button.burnout_edit_btn');
    await editButton.trigger('click');
    await wrapper.vm.$nextTick();
    const scorePerEntry = 1;
    const selectors = wrapper.findAll('select.burnout_score');
    let totalScore = selectors.length * scorePerEntry;
    for (let i = 0; i < selectors.length; i++) {
      const select = selectors.at(i);
      const options = select.findAll("option");
      options.at(scorePerEntry).setSelected();
    }
    await wrapper.find("#testForm").trigger("submit.prevent");
    await wrapper.vm.$nextTick();
    tbody = wrapper.find('[data-testid="burnoutTable"] tbody');
    const updatedRow = tbody.findAll("tr").at(0);
    const updatedScore = updatedRow.findAll("td").at(1).text();
    expect(updatedScore).toBe(totalScore.toString());
  })

  it("Verify warning is triggered", async () => {
    const wrapper = shallowMount(BurnOutComp, { localVue });
    await wrapper.vm.$nextTick();
    // Check if warning is triggered by the entry as it has been more than 3 months.
    expect(wrapper.emitted().isTestDoneInLastThreeMonths).toBeFalsy();
  })
});

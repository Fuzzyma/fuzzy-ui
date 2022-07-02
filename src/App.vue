<script setup lang="ts">
import { ref } from 'vue'
import Button from './components/Button.vue'
import Column from './components/Table/Column.vue'
import Table from './components/Table/Table.vue'

const generateRandomString = (minlen: number, maxlen: number) => {
  const len = Math.floor(Math.random() * (maxlen - minlen + 1)) + minlen
  let result = ''
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charsLen = chars.length
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * charsLen))
  }
  return result
}

const createSampleRow = (a: any, i: number) => {
  return {
    id: Math.random().toString(36).slice(-6),
    num: i,
    firstName: generateRandomString(5, 50),
    lastName: generateRandomString(5, 50),
    age: ~~(Math.random() * 100),
    address: generateRandomString(5, 50),
    city: generateRandomString(5, 50),
    state: generateRandomString(5, 50),
    zip: 10001,
    country: generateRandomString(5, 50),
    phone: generateRandomString(5, 50),
    email: generateRandomString(5, 50),
    website: generateRandomString(5, 50),
    company: generateRandomString(5, 50),
    companyAddress: generateRandomString(5, 50),
    companyCity: generateRandomString(5, 50),
    companyState: generateRandomString(5, 50),
    companyZip: 10001,
    companyCountry: generateRandomString(5, 50),
    companyPhone: generateRandomString(5, 50),
    companyFax: generateRandomString(5, 50),
    companyEmail: generateRandomString(5, 50),
    companyWebsite: generateRandomString(5, 50),
    companyDescription: generateRandomString(5, 50),
    companyLogo: generateRandomString(5, 50),
    companyFacebook: generateRandomString(5, 50),
    companyTwitter: generateRandomString(5, 50),
    companyInstagram: generateRandomString(5, 50),
    companyYoutube: generateRandomString(5, 50),
    companyLinkedIn: generateRandomString(5, 50),
    companyGoogle: generateRandomString(5, 50),
    companyPinterest: generateRandomString(5, 50),
    companyTumblr: generateRandomString(5, 50),
    companyVk: generateRandomString(5, 50),
    companyWeibo: generateRandomString(5, 50),
    companyWechat: generateRandomString(5, 50),
  }
}

const sampleRows = (number: number) => {
  return Array.from({ length: number }, createSampleRow)
}

const data = ref([
  {
    id: Math.random().toString(36).slice(-6),
    firstName: 'John',
    lastName: 'Doe',
    age: 30,
    address: '555 Main St',
    city: 'New York',
    state: 'NY',
    zip: 10001,
  },
  {
    id: Math.random().toString(36).slice(-6),
    firstName: 'Jane',
    lastName: 'Doe',
    age: 30,
    address: '555 Main St',
    city: 'New York',
    state: 'NY',
    zip: 10001,
  },
  ...sampleRows(1000),
])

const hides = ref(['id', 'firstName', 'lastName'])

const doSomething = () => {
  data.value.push(createSampleRow(0, 0))
}
const header = ref('First Name')
const changeHeader = () => {
  header.value = 'First Name 2'
}

const changeCell = (row: any) => {
  row.firstName = 'assasd'
}

const swapRow = () => {
  const row = data.value[0]
  data.value[0] = data.value[1]
  data.value[1] = row
}

const tableRef = ref<InstanceType<typeof Table>>()
const filterTable = () => {
  tableRef.value!.filter(row => {
    return (row.age as number) <= 30
  })
}

const filterAll = () => {
  tableRef.value!.filter(() => {
    return false
  })
}

const resetTable = () => {
  tableRef.value!.resetFilter()
}

const switched = ref(false)
const switchColumnOrder = () => {
  switched.value = !switched.value
}

// const updateData = console.log
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100vh">
    <div style="display: flex; flex: row">
      <Button @click="changeHeader">Change Header</Button>
      <Button @click="swapRow">Swap Row 1 and 2</Button>
      <Button @click="filterTable">Filter Age 0-30</Button>
      <Button @click="resetTable">Reset</Button>
      <Button @click="switchColumnOrder">Switch Columns</Button>
      <Button @click="filterAll">Filter All</Button>
    </div>
    <label v-for="col in ['id', 'firstName', 'lastName']" :key="col + 'hide'">
      <input v-model="hides" type="checkbox" :value="col" />
    </label>
    <div style="flex-grow: 1; display: flex; flex-direction: column; min-height: 0">
      <Table
        ref="tableRef"
        :data="data"
        style="
          flex-grow: 1;
          min-height: 0;
          overflow: hidden;
          width: 100%;
          border: 1px solid black;
          box-sizing: border-box;
        "
      >
        <Column checkbox fixed width="35"></Column>
        <Column header="Id" prop="id" :hidden="!hides.includes('id')" fixed width="100" sortable editable></Column>
        <Column header="Num" prop="num" fixed width="100" sortable editable></Column>
        <Column
          :header="header"
          prop="firstName"
          :hidden="!hides.includes('firstName')"
          fixed="left"
          width="100"
        ></Column>
        <Column
          header="Last Name"
          :hidden="!hides.includes('lastName')"
          sortable
          :order="Number(switched)"
          width="100"
        ></Column>
        <Column
          header="Age"
          sortable
          filterable
          editable
          :getter="row => Number(row.age).toFixed(4)"
          :order="Number(!switched)"
        ></Column>
        <Column header="Address" sortable filterable editable></Column>
        <Column header="City" sortable filterable editable></Column>
        <Column v-slot="{ row }" header="State" sortable filterable editable>
          <Button @click="changeCell(row)">Change Row Object</Button>
        </Column>
        <Column header="Zip" sortable filterable editable type="number"></Column>
        <Column header="Country" sortable filterable editable></Column>
        <Column header="Phone" sortable filterable editable></Column>
        <Column header="Email" sortable filterable editable></Column>
        <Column header="Website" sortable filterable editable></Column>
        <Column header="Company" sortable filterable editable></Column>
        <Column header="Company Address" sortable filterable editable></Column>
        <Column header="Company City" sortable filterable editable></Column>
        <Column header="Company State" sortable filterable editable></Column>
        <Column header="Company Zip" sortable filterable editable></Column>
        <Column header="Company Country" sortable filterable editable></Column>
        <Column header="Company Phone" sortable filterable editable></Column>
        <Column header="Company Fax" sortable filterable editable></Column>
        <Column header="Company Email" sortable filterable editable></Column>
        <Column header="Company Website" sortable filterable editable></Column>
        <Column header="Company Description" sortable filterable editable></Column>
        <Column header="Company Logo" sortable filterable editable></Column>
        <Column header="Company Facebook" sortable filterable editable></Column>
        <Column header="Company Twitter" sortable filterable editable></Column>
        <Column header="Company Instagram" sortable filterable editable></Column>
        <Column header="Company Youtube" sortable filterable editable></Column>
        <Column header="Company LinkedIn" sortable filterable editable></Column>
        <Column header="Company Google" sortable filterable editable></Column>
        <Column header="Company Pinterest" sortable filterable editable></Column>
        <Column header="Company Tumblr" sortable filterable editable></Column>
        <Column header="Company Vk" sortable filterable editable></Column>
        <Column header="Company Weibo" sortable filterable editable></Column>
        <Column header="Company Wechat" sortable filterable editable></Column>
        <Column header="Actions" sortable filterable editable width="200" fixed="right">
          <Button @click="doSomething()">Add Row</Button>
        </Column>
      </Table>
    </div>
  </div>
</template>

<style scoped>
:root {
  font-size: 40px;
}
</style>

<style>
html,
body {
  margin: 0;
  padding: 0;
  --fuzzy-ui-table-cell-min-width: 100px;
}
</style>
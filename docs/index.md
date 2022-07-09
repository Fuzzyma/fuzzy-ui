# Home

## Quick Start

Install:

```sh
yarn add fuzzy-ui
```

Import what you need:

```vue
<template>
  <FUIButton>Hello</FUIButton>
</template>

<script setup>
import { FUIButton } from 'fuzzy-ui'
</script>
```

## Why Fuzzy UI?

There are plenty of other options available. Why would you use Fuzzy UI?

I always ended up writing a new button component for some project from the ground up because other component libraries didn't give me the freedom I needed or lagged functionality. And if I ended up using any component from a lib, it would include loads of code of the lib even though I wasnt using it. This also increased build times. Transpiling 7000 components is no joke.

This lib aims to solve this problems by giving you the bare bone functionality you always need and lets you style it to your needs. It also makes sure, that no other dependencies are pulled in and you get ONLY what you imported.

## Button

```vue
<template>
  <FUIButton @click="longRunning">Click Me</FUIButton>
</template>

<script setup>
import { FUIButton } from 'fuzzy-ui'
const longRunning = () => {
  return new Promise(resolve => {
    setTimeout(resolve, 1000)
  })
}
</script>

<style>
:root {
  --fuzzy-ui-button-background-color: #0070f3;
  --fuzzy-ui-button-hover-background-color: #0060e9;
  --fuzzy-ui-button-active-background-color: #0050d7;
  --fuzzy-ui-button-disabled-background-color: #66aeff;
  --fuzzy-ui-button-border-color: #7ebaff;
  --fuzzy-ui-button-active-color: #bcbcbc;
  --fuzzy-ui-button-color: #fff;
  --fuzzy-ui-button-font-size: 5rem;
}
</style>
```

Which would result in a filled button:

<FUIButton @click="longRunning">Click Me</FUIButton>

<script setup>
import { FUIButton } from '../src/index'
const longRunning = () => {
  return new Promise(resolve => {
    setTimeout(resolve, 1000)
  })
}

import { FUITable, FUIColumn } from '../src/index'
import { ref } from 'vue'

const toDate = row => {
  return row.dateOfBirth.split('.').reverse().join('-')
}

const fromDate = (row, value) => {
  return row.dateOfBirth = value.split('-').reverse().join('.')
}

const data = ref([
  {
    name: 'John Doe',
    age: '25',
    email: 'john.doe@example.com',
    phone: '+49 123456789',
    dateOfBirth: '01.01.2000',
    status: 'active',
  },
  {
    name: 'Jane Doe',
    age: '24',
    email: 'jane.doe@example.com',
    phone: '+49 987654321',
    dateOfBirth: '12.12.2003',
    status: 'inactive',
  },
  {
    name: 'David Smith',
    age: '23',
    email: 'david.smith@example.com',
    phone: '+49 987654321',
    dateOfBirth: '03.05.2012',
    status: '', // show placeholder
  }
])

const statusOptions = [
  {
    value: 'active',
    label: 'Active',
  },
  {
    value: 'inactive',
    label: 'Inactive',
  },
]
</script>

<style>
:root {
  --fuzzy-ui-button-background-color: #0070f3;
  --fuzzy-ui-button-hover-background-color: #0060e9;
  --fuzzy-ui-button-active-background-color: #0050d7;
  --fuzzy-ui-button-disabled-background-color: #66aeff;
  --fuzzy-ui-button-border-color: #7ebaff;
  --fuzzy-ui-button-active-color: #bcbcbc;
  --fuzzy-ui-button-color: #fff;
  --fuzzy-ui-button-font-size: 5rem;
}
</style>

## Table

```vue
<template>
  <FUITable :data="data" show-all>
    <FUIColumn header="Name" sortable editable fixed="left" width="100" />
    <FUIColumn header="Age" sortable editable width="200" />
    <FUIColumn header="Email" sortable editable width="200" />
    <FUIColumn header="Phone" sortable editable width="200" />
    <FUIColumn header="Date of Birth" sortable editable type="date" :getter="toDate" :setter="fromDate" getter-on-edit  width="200" />
    <FUIColumn header="Status" fixed="right" :options="statusOptions" editable width="200" />
  </FUITable>
</template>

<script setup>
import { FUITable, FUIColumn } from '../src/index'
import { ref } from 'vue'

const toDate = row => {
  return row.dateOfBirth.split('.').reverse().join('-')
}

const fromDate = (row, value) => {
  return row.dateOfBirth = value.split('-').reverse().join('.')
}

const data = ref([
  {
    name: 'John Doe',
    age: '25',
    email: 'john.doe@example.com',
    phone: '+49 123456789',
    dateOfBirth: '01.01.2000',
    status: 'active',
  },
  {
    name: 'Jane Doe',
    age: '24',
    email: 'jane.doe@example.com',
    phone: '+49 987654321',
    dateOfBirth: '12.12.2003',
    status: 'inactive',
  },
  {
    name: 'David Smith',
    age: '23',
    email: 'david.smith@example.com',
    phone: '+49 987654321',
    dateOfBirth: '03.05.2012',
    status: '', // show placeholder
  }
])

const statusOptions = [
  {
    value: 'active',
    label: 'Active',
  },
  {
    value: 'inactive',
    label: 'Inactive',
  },
]
</script>
```

<FUITable :data="data" class="vp-raw" show-all>
  <FUIColumn header="Name" sortable editable fixed="left" width="100" />
  <FUIColumn header="Age" sortable editable width="200" />
  <FUIColumn header="Email" sortable editable width="200" />
  <FUIColumn header="Phone" sortable editable width="200" />
  <FUIColumn header="Date of Birth" sortable editable type="date" :getter="toDate" :setter="fromDate" getter-on-edit  width="200" />
  <FUIColumn header="Status" fixed="right" :options="statusOptions" editable width="200" />
</FUITable>

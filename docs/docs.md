# Docs

## Table

Lets start with an example that should give you most of the tools you need to use the table

```vue
<template>
  <FUITable :data="tableData" ref="tableRef">
    <!--
    fixed or fixed="left" will fix the column to the left
    checkbox is a special attribute, it will be rendered as a checkbox
    every fixed column needs to have a width defined.
    it is advised to also define a width for the other columns but not strictly required
  -->
    <FUIColumn checkbox fixed width="50" />
    <!--
    header specifies the headong of the column
    it will automatically assume that the prop attribute is "colOneIsCool"
  -->
    <FUIColumn header="Col One is cool" />
    <!--
    prop specifies the property that is shown in this column
    order lets you reorder columns as needed. The next 2 columns are swapped
    It is advised to set an order on all unfixed columns if you plan on reordering them
  -->
    <FUIColumn header="Col2" prop="col6" order="2" />
    <!--
    getter and setter can be used to convert the data to something else
    or convert the input to something else if the column is editable
    If you pass a custom getter, and setter, you dont need to pass prop
  -->
    <FUIColumn header="Col3" :getter="getterCol3" :setter="setterCol3" order="1" editable />
    <!--
    sortable will make this column... sortable
  -->
    <FUIColumn header="Col4" prop="col4" order="3" sortable />
    <!--
    you can also pass a sort function to the sortable attribute
  -->
    <FUIColumn header="Col5" prop="col4" order="4" :sortable="customSort" />
    <!--
    If you need to hide columns, you can use the hidden attribute
    CAUTION: Dont use v-if and v-show. They will break the table
  -->
    <FUIColumn header="Col6" prop="col6" order="5" hidden />
    <!-- 
    Example of a fixed-right column
  -->
    <FUIColumn header="Col7" prop="col7" fixed="right" width="100" />
    <!--
    You can pass custom components (e.g. buttons) as slot to the column
  -->
    <FUIColumn header="Col8" prop="col8" order="6" v-slot="{ row, col }">
      <button @click="onClickCol8(row, col)">Click me</button>
    </FUIColumn>
  </FUITable>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { FUIColumn, FUITablem, Row, Col } from 'fuzzy-ui'

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

const tableRef = ref()

const tableData = ref([
  {
    // All columns defined above with random content:
    colOneIsCool: generateRandomString(5, 10),
    // We dont need col2 because it is never accessed
    col3: 0.12345
    col4: generateRandomString(5, 10),
    col5: generateRandomString(5, 10),
    col6: generateRandomString(5, 10),
    col7: generateRandomString(5, 10),
    col8: generateRandomString(5, 10),
  },
  {
    // All columns defined above with random content:
    colOneIsCool: generateRandomString(5, 10),
    // We dont need col2 because it is never accessed
    col3: 0.1358653
    col4: generateRandomString(5, 10),
    col5: generateRandomString(5, 10),
    col6: generateRandomString(5, 10),
    col7: generateRandomString(5, 10),
    col8: generateRandomString(5, 10),
  },
])


// Hide some precision and only show it when editing
const getterCol3 = (row: Row) => {
  return row.col3.toFixed(2)
}

// Converts string to number
const setterCol3 = (row: Row, value: string) => {
  row.col3 = parseFloat(value)
}

// sort string by their length instead of their content
const customSort = (a: Row, b: Row) => {
  return a.col4.length - b.col4.length
}

const onClickCol8 = (row: Row, col: Col) => {
  console.log(row, col)
}
</script>
```

To summarize - These are the props you can use on a column:

- header: The header of the column
- prop: The property that is shown in this column
- getter: A custom getter function that is used to convert the data to something else
- setter: A custom setter function that is used to convert the input to something else
- order: The order of the column. This is used to reorder the columns
- sortable: Makes this column sortable
- hidden: Hides this column
- editable: Makes this column editable
- fixed: Makes this column fixed to the left or right
- width: The width of the column
- getter-on-edit: Usually, when a getter is used, you will still see the source data when you edit the field. This is to make sure that precision in numbers doesnt get lost. However, sometimes this is not desired e.g. when using date inputs that take only strings of the form yyyy-mm-dd. This prop can be set, to make sure, the getter value is used on edit as well

You may have missed the filter functionality. This is not by chance. Filters are not realized through some prop magic but have to be invoked manually. This is because filters are mostly too different to allow for a generic approach.

To filter the table you simply call:

```ts
tableRef.value.filter((row: Row) => {
  return row.colOneIsCool.includes('cool')
})
```

To reset the filter, you call:

```ts
tableRef.value.resetFilter()
```

**CAUTION**: The data prop is used as source AS IS. That means, changing the array WILL result in the table changing. This is by design and to avoid expensive rerenders. That also means, you can add rows to the table by just pushing into the data array.

### Finally: Table props

Next to the obvious :data prop which can be used v-model as well, it is possible to hook the update-cycle of the table.
If you use them, you are responsable for the update of the table data. Passing a noop will basically mean that all changes in fields are reverted when you leave the field:

- onUpdateField: Is called with the index of the row, the prop name and the new value.
- onUpdateRow: Is passed with the index and the updated row
- onUpdate:data: Is called with the new data array

These fastest function is the field-update function because it is not required to clone any data.
Making use of v-model or onUpdate:data will yield a performance hit because all data is cloned and the table will rerender if you set :data to a new array.

You can return promises to wait for async functions to finish. That means, you can directly make a server call to update the data on the server. If it fails, you can simply not update the table and it will revert back.

Most of the time you dont need these handlers because the data you pass into the table is updated by the table itself.

If you pass a custom setter, no update function is called at all. It is expected that you handle all required logic in the setter itself

### Styling the table

The following css vars can be changed to change the styling of the table:

```css
:root {
  --fuzzy-ui-table-col-bg-fixed: #dddddd;
  --fuzzy-ui-table-header-bg: #f5f5f5;
  --fuzzy-ui-table-header-bg-fixed: var(--fuzzy-ui-table-col-bg-fixed);
  --fuzzy-ui-table-row-bg: white;
  --fuzzy-ui-table-row-bg-checked: #f0f0f0;
  --fuzzy-ui-table-row-bg-hover: #ccc;
  --fuzzy-ui-table-header-color: #333;
  --fuzzy-ui-table-header-font-size: 16px;
  --fuzzy-ui-table-header-font-weight: bold;
  --fuzzy-ui-table-header-height: 40px;
  --fuzzy-ui-table-header-padding: 10px;
  --fuzzy-ui-table-header-border-bottom: 1px solid #e5e5e5;
  --fuzzy-ui-table-cell-padding: 10px;
  --fuzzy-ui-table-cell-font-size: 14px;
  --fuzzy-ui-table-cell-font-weight: normal;
  --fuzzy-ui-table-cell-color: #333;
  --fuzzy-ui-table-cell-border-color: #e5e5e5;
  --fuzzy-ui-table-cell-border-width: 1px;
  --fuzzy-ui-table-cell-min-width: auto;
  --fuzzy-ui-table-cell-height: calc(var(--fuzzy-ui-table-cell-font-size) + var(--fuzzy-ui-table-cell-padding) * 2);
  --fuzzy-ui-table-row-height: calc(
    var(--fuzzy-ui-table-cell-height) + var(--fuzzy-ui-table-cell-border-width) * 2 + 2px
  );
}
```

## Button

The button will autosize to its fontsize together with the icon. This are different ways to create a button:

```vue
<template>
  <!-- Most likely the easiest usage -->
  <FUIButton @click="doSomethingLong">Click Me</FUIButton>
  <FUIButton @click="doSomethingLong" label="Click Me" />
  <FUIButton @click="doSomethingLong" label="Click Me" :icon="IconComponent" />

  <!-- Icon slot -->
  <FUIButton @click="doSomethingLong" label="Click Me">
    <template #icon><i-carbon-accessibility /></template>
  </FUIButton>

  <!-- Icon Only (automatically squared) -->
  <FUIButton @click="doSomethingLong" :icon="IconComponent" />
  <FUIButton @click="doSomethingLong">
    <template #icon><i-carbon-accessibility /></template>
  </FUIButton>

  <!-- label slot -->
  <FUIButton @click="doSomethingLong">
    <template #label>Click Me</template>
  </FUIButton>

  <!--use a different loader than default -->
  <FUIButton @click="doSomethingLong" :loader="LoaderComponent" label="Click Me" />
  <FUIButton @click="doSomethingLong" label="Click Me">
    <template #loader><FUIDotLoader /></template>
  </FUIButton>

  <!-- force square button (or not square for icon only) -->
  <FUIButton @click="doSomethingLong" square label="Click Me" />
  <FUIButton @click="doSomethingLong" :square="false" :icon="IconComponent" />

  <!-- force loading state -->
  <FUIButton label="Click Me" :loading="true" />

  <!-- render as link -->
  <FUIButton href="https://www.google.com" label="Click Me" />
  <!-- render as any component you want -->
  <FUIButton is="span" label="Click Me" />
  <FUIButton :is="ButtonComponent" label="Click Me" />
</template>

<script setup>
import { h } from 'vue'
import { FUIButton, FUIDotLoader } from 'fuzzy-ui'

const IconComponent = { render: () => h('A') } // fake icon
const LoaderComponent = { render: () => h('L') } // fake icon
const ButtonComponent = FUIButton

// Returning a promise will automatically trigger loading state
const doSomethingLong = () => {
  return new Promise(resolve => {
    setTimeout(resolve, 1000)
  })
}
</script>
```

### Customize styling

To customize the styling of the button component, you can overwrite the following css vars:

```css
:root {
  --fuzzy-ui-button-padding: 0.15em 0.4em;
  --fuzzy-ui-button-border-radius: 0.125em;
  --fuzzy-ui-button-border-width: 1px;
  --fuzzy-ui-button-border-color: currentColor;
  --fuzzy-ui-button-background-color: white;
  --fuzzy-ui-button-color: currentColor;
  --fuzzy-ui-button-hover-background-color: #f0f0f0;
  --fuzzy-ui-button-hover-color: currentColor;
  --fuzzy-ui-button-active-background-color: #e0e0e0;
  --fuzzy-ui-button-active-color: currentColor;
  --fuzzy-ui-button-disabled-background-color: #f0f0f0;
  --fuzzy-ui-button-disabled-color: currentColor;
  --fuzzy-ui-button-disabled-opacity: 0.5;
  --fuzzy-ui-button-loading-color: currentColor;
  --fuzzy-ui-button-loading-opacity: 0.8;
  --fuzzy-ui-button-icon-size: 1em;
  --fuzzy-ui-button-font-size: 1em;
}
```

### Creating Custom Buttons

The button component is not meant to use as is. Since every use case requires different styling, FUIButton only serves as a base for creating custom buttons. You can create your own button by extending the FUIButton component. The styling can be changed by changing the css vars.

A filled button could look like this:

```vue
<template>
  <!-- this will wrap all slots available so the functionality is not lost -->
  <FUIButton v-bind="$attrs" class="filled">
    <template v-for="(_, slot) of $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </FUIButton>
</template>

<script setup>
  import { FUIButton } from 'fuzzy-ui'
</script>

<style scoped>
.filled {
  --fuzzy-ui-button-background-color: #0070f3;
  --fuzzy-ui-button-hover-background-color: #0060e9;
  --fuzzy-ui-button-active-background-color: #0050d7;
  --fuzzy-ui-button-disabled-background-color: #66aeff;
  --fuzzy-ui-button-border-color: #7ebaff;
  --fuzzy-ui-button-active-color: #bcbcbc;
  --fuzzy-ui-button-color: #fff;
  font-size: 40px;
}
</style>

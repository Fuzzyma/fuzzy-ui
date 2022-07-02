<template>
  <svg class="fuzzy-ui-circle-loader" viewBox="0 0 50 50">
    <circle cx="25" cy="25" r="20" />
  </svg>
</template>

<script setup lang="ts"></script>

<style>
:where(.fuzzy-ui-circle-loader) {
  animation: fuzzy-ui-circle-loader-animation 1s linear infinite;
  fill: none;
  stroke: currentColor;
  stroke-width: 2px;
  stroke-dasharray: 100%;
  opacity: 0.8;
  width: var(--fuzzy-ui-button-icon-size);
  height: var(--fuzzy-ui-button-icon-size);
}

@keyframes fuzzy-ui-circle-loader-animation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

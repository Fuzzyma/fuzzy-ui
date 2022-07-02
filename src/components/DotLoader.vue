<template>
  <svg v-for="i of [0, 1, 2]" :key="i" class="fuzzy-ui-dot-loader" viewBox="0 0 50 50">
    <circle cx="25" cy="25" r="10" />
  </svg>
</template>

<script setup lang="ts"></script>

<style>
:where(.fuzzy-ui-dot-loader circle) {
  animation: fuzzy-ui-dot-loader-animation 1s infinite;
  fill: currentColor;
  animation-delay: 0.1s;
  opacity: 0.8;
}
:where(.fuzzy-ui-dot-loader:nth-child(2) circle) {
  animation-delay: 0.2s;
}
:where(.fuzzy-ui-dot-loader:nth-child(3) circle) {
  animation-delay: 0.3s;
}

@keyframes fuzzy-ui-dot-loader-animation {
  from {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

:where(.fuzzy-ui-dot-loader) {
  width: var(--fuzzy-ui-button-icon-size);
  height: var(--fuzzy-ui-button-icon-size);
}
</style>

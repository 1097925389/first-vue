<template>
  <div class="about">
    <CanvasImg></CanvasImg>
  </div>
</template>

<script setup>
import CanvasImg from '../components/CanvasImg.vue'
</script>
<style>
@media (min-width: 1024px) {
  .about {
    display: flex;
    align-items: center;
  }
}
</style>

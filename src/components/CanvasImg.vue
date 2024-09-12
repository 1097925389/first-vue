<template>
  <div>
    <input type="file" @change="onFileChange" accept="image/*" />
    <canvas ref="canvas" style="display: none"></canvas>
    <img :src="watermarkedImage" v-if="watermarkedImage" @click="openPreview" class="img" />
    <button @click="downloadImage" v-if="watermarkedImage">下载图片</button>
    <!-- 图片预览弹窗 -->
    <div v-if="isPreviewVisible" class="preview-overlay" @click="closePreview">
      <img :src="watermarkedImage" class="preview-image" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const watermarkedImage = ref(null)
const canvas = ref(null)
const isPreviewVisible = ref(false)

const onFileChange = (event) => {
  const file = event.target.files[0]
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        addWatermark(img)
      }
    }
    reader.readAsDataURL(file)
  }
}

const addWatermark = (img) => {
  const ctx = canvas.value.getContext('2d')
  canvas.value.width = img.width
  canvas.value.height = img.height
  ctx.drawImage(img, 0, 0)

  // 设置水印样式
  const text = '厉凯伦 复印无效'
  const fontSize = 48
  ctx.font = `${fontSize}px Arial`
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 计算水印的对角线距离，保证全屏铺满
  // 设置旋转角度为30度
  const angle = -(Math.PI / 180) * 30
  const textWidth = ctx.measureText(text).width
  const diagonal = Math.sqrt(Math.pow(canvas.value.width, 2) + Math.pow(canvas.value.height, 2))
  const step = Math.max(textWidth, fontSize) * 1.5 // 水印之间的间隔

  ctx.translate(canvas.value.width / 2, canvas.value.height / 2)
  ctx.rotate(angle)

  for (let x = -diagonal / 2; x <= diagonal / 2; x += step) {
    for (let y = -diagonal / 2; y <= diagonal / 2; y += step) {
      ctx.fillText(text, x, y)
    }
  }

  ctx.rotate(angle)
  ctx.translate(-canvas.value.width / 2, -canvas.value.height / 2)

  watermarkedImage.value = canvas.value.toDataURL('image/png')
}

const openPreview = () => {
  isPreviewVisible.value = true
}

const closePreview = () => {
  isPreviewVisible.value = false
}
const downloadImage = () => {
  const link = document.createElement('a')
  link.href = watermarkedImage.value
  link.download = 'watermarked-image.png'
  link.click()
}
</script>

<style scoped>
/* 你的样式 */
.img {
  width: 300px;
  height: 300px;
  cursor: pointer;
}
.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-image {
  max-width: 90%;
  max-height: 90%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}
</style>

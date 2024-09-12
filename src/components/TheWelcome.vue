<template>
  <div>
    <h2>上传并处理Excel文件</h2>
    <input type="file" @change="handleFileUpload" accept=".xlsx, .xls" />

    <button @click="processData" v-if="workbook">处理并下载文件</button>
    <div>----------------------------</div>
    <h2>汇总</h2>
    <ExcelUploader />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import * as XLSX from 'xlsx'
import ExcelUploader from './ExcelUploader.vue'

const workbook = ref(null)

/**
 * 处理文件上传
 * @param {Event} event - 文件上传事件
 */
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result)
      workbook.value = XLSX.read(data, { type: 'array' })
    }
    reader.readAsArrayBuffer(file)
  }
}
/**
 * 处理数据并下载处理后的Excel文件
 */
const processData = () => {
  const newWorkbook = XLSX.utils.book_new()

  // 遍历每个工作表
  workbook.value.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.value.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    console.log('原始数据:', jsonData) // 输出原始数据进行调试

    // 按电缆规格分组并求和
    const groupedData = {}
    jsonData.forEach((row) => {
      // 取出电缆规格列并统一格式
      let spec = row['电缆规格']?.toString().trim().replace(/\s+/g, ' ') || ''
      spec = spec.replace(/，/g, ',') // 将中文逗号替换为英文逗号

      // 如果没有斜杠，则将连字符替换为逗号
      if (!spec.includes('/')) {
        spec = spec.replace(/-/g, ',') // 将连字符替换为英文逗号
      }

      const length = parseFloat(row['总长']) || 0
      const length_1 = parseFloat(row['总长_1']) || 0 // 假设总长_1 是总长加上10

      // 跳过没有电缆规格的行
      if (!spec) {
        console.warn('跳过没有电缆规格的行:', row)
        return
      }

      // 处理有效数据
      if (groupedData[spec]) {
        groupedData[spec].totalLength += length
        groupedData[spec].totalLength_1 += length_1
      } else {
        groupedData[spec] = {
          totalLength: length,
          totalLength_1: length_1
        }
      }
    })

    console.log('分组数据:', groupedData) // 输出分组后的数据进行调试

    // 转换为适合输出的格式
    const outputData = Object.keys(groupedData).map((spec) => ({
      电缆规格: spec,
      总长: groupedData[spec].totalLength,
      总长_1: groupedData[spec].totalLength_1
    }))

    // 将处理后的数据添加到新的工作表中
    const newWorksheet = XLSX.utils.json_to_sheet(outputData)
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName)
  })

  // 导出新的Excel文件
  XLSX.writeFile(newWorkbook, 'processed_data.xlsx')
}
</script>

<template>
  <div>
    <input type="file" @change="onTemplateFileChange" />
    <input type="file" @change="onDataFileChange" />
    <button @click="processFiles">处理文件</button>
    <div v-if="errorMessage">{{ errorMessage }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const specifications = ref([])
const templateWorkbook = ref(null)
const errorMessage = ref('')

// 中文标点符号替换为英文标点符号
const convertPunctuation = (str) => {
  if (typeof str !== 'string') return ''
  const punctuationMap = {
    '，': ',',
    '。': '.',
    '！': '!',
    '？': '?',
    '；': ';',
    '：': ':',
    '（': '(',
    '）': ')',
    '【': '[',
    '】': ']',
    '《': '<',
    '》': '>',
    '、': ',',
    '—': '-',
    '／': '/',
    '～': '~'
  }
  return str.replace(/[\u3000-\u303F\uFF00-\uFFEF]/g, (match) => punctuationMap[match] || match)
}

// 标准化字符串，去除空格和转换标点符号
const normalizeString = (str) => {
  if (typeof str !== 'string') return ''
  const noSpaces = str.replace(/\s+/g, '')
  return convertPunctuation(noSpaces)
}

// 文件选择事件处理
const onTemplateFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        if (workbook.SheetNames.length < 2) {
          errorMessage.value = '模板文件中没有第二页。'
          console.error('模板文件中没有第二页')
          return
        }

        templateWorkbook.value = workbook
        console.log('模板工作表:', workbook.SheetNames)
      } catch (error) {
        errorMessage.value = '无法加载模板文件。请检查文件格式。'
        console.error('模板文件加载错误:', error)
      }
    }
    reader.readAsArrayBuffer(file)
  }
}

const onDataFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        if (!workbook.SheetNames.length) {
          errorMessage.value = '数据文件中没有有效的工作表。'
          console.error('数据工作表为空或未加载成功')
          return
        }

        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0]

        if (!headers || !Array.isArray(headers)) {
          errorMessage.value = '数据文件的第一行缺少表头。'
          console.error('数据文件的第一行缺少表头。')
          return
        }

        const specIndex = headers.indexOf('规格')
        const quantityIndex = headers.indexOf('图纸数量')

        if (specIndex === -1 || quantityIndex === -1) {
          errorMessage.value = '数据文件中缺少必要的列（"规格" 或 "图纸数量"）。'
          console.error('数据文件中缺少必要的列')
          return
        }

        const specs = []
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
        for (let i = 1; i < rows.length; i++) {
          // 跳过标题行
          const row = rows[i]
          const spec = normalizeString(row[specIndex] || 'N/A')
          const quantity = row[quantityIndex] || 0
          specs.push({ spec, quantity })
        }

        specifications.value = specs
      } catch (error) {
        errorMessage.value = '无法加载数据文件。请检查文件格式。'
        console.error('数据文件加载错误:', error)
      }
    }
    reader.readAsArrayBuffer(file)
  }
}

const processFiles = async () => {
  if (!templateWorkbook.value || !specifications.value.length) {
    errorMessage.value = '请先上传模板文件和数据文件。'
    return
  }

  try {
    const templateSheets = templateWorkbook.value.SheetNames
    const templateData = templateWorkbook.value.Sheets

    // 创建一个新的 ExcelJS 工作簿
    const newWorkbook = new ExcelJS.Workbook()

    // 保留所有分页和样式
    for (const sheetName of templateSheets) {
      const sheet = templateData[sheetName]
      const newSheet = newWorkbook.addWorksheet(sheetName)

      // 复制样式和数据
      for (const [address, cell] of Object.entries(sheet)) {
        if (cell.v) {
          const newCell = newSheet.getCell(address)
          newCell.value = cell.v

          // 保留原来的样式
          if (cell.s) {
            newCell.font = cell.s.font
            newCell.fill = cell.s.fill
            newCell.border = cell.s.border
            newCell.alignment = cell.s.alignment
          }
        }
      }
    }

    // 处理第二页
    const templateSheet = templateData[templateSheets[1]] // 第二页的工作表
    const rows = XLSX.utils.sheet_to_json(templateSheet, { header: 1 })
    if (rows.length < 2) {
      errorMessage.value = '模板文件的第二页没有足够的数据行。'
      console.error('模板文件的第二页没有足够的数据行')
      return
    }

    // 打印出列头以调试
    const headers = rows[1] // 第一行是标题行
    console.log('模板文件的第二页列头:', headers)

    const nameIndex = headers.indexOf('名称')
    const actualQuantityIndex = headers.indexOf('实际图纸数量')

    if (nameIndex === -1 || actualQuantityIndex === -1) {
      errorMessage.value = '模板文件的第二页中缺少必要的列（"名称" 或 "实际图纸数量"）。'
      console.error('模板文件的第二页中缺少必要的列', headers)
      return
    }

    const specMap = new Map(specifications.value.map((item) => [item.spec, item.quantity]))

    // 更新数据并标记颜色
    const targetSheet = newWorkbook.getWorksheet(templateSheets[1])
    for (let i = 1; i < rows.length; i++) {
      // 从第二行开始（标题行已处理）
      const row = rows[i]
      const name = normalizeString(row[nameIndex] || '')
      for (const [spec, quantity] of specMap) {
        if (name.includes(spec)) {
          row[actualQuantityIndex] = quantity // 更新实际图纸数量
          const cell = targetSheet.getCell(i + 1, actualQuantityIndex + 1)

          // 保留原始样式
          const originalCell =
            templateSheet[XLSX.utils.encode_cell({ c: actualQuantityIndex, r: i })]
          if (originalCell.s) {
            cell.font = originalCell.s.font || cell.font
            cell.fill = originalCell.s.fill || cell.fill
            cell.border = originalCell.s.border || cell.border
            cell.alignment = originalCell.s.alignment || cell.alignment
          }

          // 更改文字颜色为红色
          cell.font = { ...cell.font, color: { argb: 'FFFF0000' } } // 红色字体
          break
        }
      }
    }

    // 保存新的工作簿
    const buffer = await newWorkbook.xlsx.writeBuffer()
    saveAs(
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }),
      'updated_template.xlsx'
    )
  } catch (error) {
    errorMessage.value = '处理文件时发生错误。'
    console.error('处理文件错误:', error)
  }
}
</script>

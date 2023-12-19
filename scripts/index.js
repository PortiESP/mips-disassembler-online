import { funcs, i_opCode, registers_table, j_opCode } from "../data/instruction_decode.js"
import updateTable, { resetTable, appendTable } from "./tables.js"
import { parseSignedInt } from "./tools.js"

const $instruction = document.getElementById("instruction-code")
const $instructionAddr = document.getElementById("instruction-address")

// Event
$instruction.addEventListener("blur", (e) => {
  e.target.value = e.target.value.replace(/-/g, "")
  e.target.value = e.target.value.replace(/(.{2})/g, "$1-")
  e.target.value = e.target.value.replace(/-$/, "")
  handleInput(e)
})
$instruction.addEventListener("input", handleInput)
$instructionAddr.addEventListener("input", handleInput)

// Initial
$instruction.value = localStorage.getItem("instruction") || ""
$instructionAddr.value = localStorage.getItem("address") || ""
handleInput({ target: { value: "0x00000000" } })

// -----------------------------------------------------------------------------------------------------------------------------------------
// Manage input events from both inputs
function handleInput(e) {
  console.log("Instruction: " + document.getElementById("instruction-code").value || undefined)
  console.log("PC: " + document.getElementById("instruction-address").value || undefined)

  const isValidAddr = parseInstructionAddrInputValue() // Check if the address is valid
  const isValidIns = parseInstructionInputValue() // Check if the instruction is valid

  // If both are valid, parse the instruction
  if (isValidAddr && isValidIns) parseInstructionCode()
}

// Parse the instruction code input value
function parseInstructionInputValue() {
  const $element = document.getElementById("instruction-code")

  // Transformations
  $element.value = $element.value.replace(/[^0-9A-F\-]/gi, "")  // Remove invalid characters
  $element.value = $element.value.toUpperCase()  // Convert to uppercase
  $element.value = $element.value.slice(0, 11)  // Remove extra characters

  // If the instruction is valid, save it to the local storage and return
  if ($element.value.replaceAll("-", "").match(/[0-9A-F]{8}/i)) {
    localStorage.setItem("instruction", $element.value)
    $element.style.outline = "none"
    return true
  }

  // (else) If the instruction is not valid, reset the table and return
  resetTable()
  // Outline the input with red
  $element.style.outline = "1px solid red"
  return false
}


// Parse the instruction address input value
function parseInstructionAddrInputValue() {
  const $element = document.getElementById("instruction-address")

  // Transformations
  $element.value = $element.value.slice(0, 10)  // Remove extra characters
  $element.value = $element.value.replace(/[^x0-9A-F]/gi, "")  // Remove invalid characters

  // If the address is valid, return
  if ($element.value.match(/0x[0-9A-F]{8}/i)) {
    localStorage.setItem("address", $element.value)
    $element.style.outline = "none"
    return true
  }
  // (else) If the address is not valid, reset the table and return
  resetTable()
  // Outline the input with red
  $element.style.outline = "1px solid red"
  return false
}


// Parse the instruction code if both inputs are valid
function parseInstructionCode() {
  const $insCode = document.getElementById("instruction-code")

  const insCode = $insCode.value.split("-").reverse().join("")
  const instructionHex = parseInt(insCode, 16)
  const opcode = instructionHex >>> 26

  console.log("-----------------------------------------------------------------------------------")
  console.log("Instruction: 0x" + insCode)
  console.log("Opcode: " + opcode.toString(2).padStart(6, "0"))

  let info = undefined
  // Parse the instruction depending on the opcode
  if (opcode === 0x00) info = parseR(instructionHex)  // R-Type
  else if (opcode === 0x02 || opcode === 0x03) info = parseJ(instructionHex)  // J-Type
  else info = parseI(instructionHex)  // I-Type

  if (info === undefined) resetTable()

  console.log("INFO", info)
}

// -----------------------------------------------------------------------------------------------------------------------------------------

// Parse R-Type instructions
function parseR(instructionHex) {
  console.log("Type R")

  // Get instruction fields
  const instructionBin = instructionHex.toString(2).padStart(32, "0")
  const op_code = instructionBin.slice(0, 6)
  const rs = instructionBin.slice(6, 11)
  const rt = instructionBin.slice(11, 16)
  const rd = instructionBin.slice(16, 21)
  const shamt = instructionBin.slice(21, 26)
  const funct = instructionBin.slice(26)

  // Return if the opcode is not valid
  if (funcs[op_code] === undefined) return undefined

  // Other calculated values
  const pc = parseInt(document.getElementById("instruction-address").value.split("x")[1], 16)

  const info = {
    op_code,
    fieldsNames: ["COD. OP", "RS", "RT", "RD", "SHAMT", "FUNCT"],
    fieldsBits: [op_code, rs, rt, rd, shamt, funct],
    mnemonic: funcs[funct],
    nextAddr: pc + 4, // PC+4
    type: "R",
    instruction: `<kbd>${funcs[funct].toLowerCase()} ${registers_table[rd]}, ${registers_table[rs]}, ${registers_table[rt]}</kbd>`,
  }

  // Special case for instructions parameters
  switch (info.mnemonic) {
    case "JR":
      info.instruction = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rs]}</kbd>`
      break
    case "SLL":
    case "SRL":
      info.instruction = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rd]}, ${registers_table[rt]}, ${parseInt(shamt, 2)}</kbd>`
      break
    case "JALR":
      info.instruction = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rs]}, ${registers_table[rd]}</kbd>`
      break
    case "MFHI":
    case "MFLO":
      info.instruction = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rd]}</kbd>`
      break
    case "MULT":
    case "MULTU":
    case "DIV":
    case "DIVU":
      info.instruction = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rs]}, ${registers_table[rt]}</kbd>`
      break
    case "SYSCALL":
      info.instruction = `<kbd>${info.mnemonic.toLowerCase()}</kbd>`
      break
  }

  updateTable([
    ["Instruction address ($PC)", `0x${pc.toString(16).padStart(8, "0")}`],
    ["Instruction code (little-endian)", `0x${instructionHex.toString(16).padStart(8, "0")}`],
    ["I-Type intructions syntax", "<kbd>mnemo rd, rs, rt</kbd>"],
    ["Intruction disassembled", info.instruction],
    ["Type", "R-Type"],
    ["Fields names", info.fieldsNames.join(" | ")],
    ["Fields bits", info.fieldsBits.join(" | ")],
    ["Operand values", `Cod.Op=${parseInt(op_code, 2)} | RS=${parseInt(rs, 2)}  |  RT=${parseInt(rt, 2)}  |  RD=${parseInt(rd, 2)}  |  SHAMT=${parseInt(shamt, 2)}  |  FUNCT=${parseInt(funct, 2)}`],
  ])

  return info
}

// Parse J-Type instructions
function parseJ(instructionHex) {
  console.log("Type J")

  const pc = parseInt(document.getElementById("instruction-address").value.split("x")[1], 16)

  // Get instruction fields
  const instructionBin = instructionHex.toString(2).padStart(32, "0")
  const op_code = instructionBin.slice(0, 6)
  const target = instructionBin.slice(6)

  // Return if the opcode is not valid
  if (j_opCode[op_code] === undefined) return undefined


  const targetAddr = ((pc + 4) & 0xf0000000) | (parseInt(target, 2) << 2)

  const info = {
    op_code,
    fieldsNames: ["COD. OP", "TARGET"],
    fieldsBits: [op_code, target],
    address: targetAddr,
    mnemonic: j_opCode[op_code],
    nextAddr: `0x${targetAddr.toString(16).padStart(8, "0")}`,
    type: "J",
    instruction: `<kbd>${j_opCode[op_code].toLowerCase()} someLabel</kbd>`,
  }

  // Special case for instructions type I parameters
  updateTable([
    ["Instruction address ($PC)", `0x${pc.toString(16).padStart(8, "0")}`],
    ["Instruction code (little-endian)", `0x${instructionHex.toString(16).padStart(8, "0")}`],
    ["I-Type intructions syntax", "<kbd>mnemo someLabel</kbd>"],
    ["Intruction disassembled", info.instruction],
    ["Type", "J-Type"],
    ["Fields names", info.fieldsNames.join(" | ")],
    ["Fields bits", info.fieldsBits.join(" | ")],
    ["Operand values", `TARGET=${parseInt(target, 2)}`],
    ["Jump to", `0x${info.nextAddr.toString(16).padStart(8, "0")}`],
  ])

  return info
}

// Parse I-Type instructions
function parseI(instructionHex) {
  console.log("Type I")

  // Get instruction fields
  const instructionBin = instructionHex.toString(2).padStart(32, "0")
  const op_code = instructionBin.slice(0, 6)
  const rs = instructionBin.slice(6, 11)
  const rd = instructionBin.slice(11, 16)
  const immediate = instructionBin.slice(16)

  // Return if the opcode is not valid
  if (i_opCode[op_code] === undefined) return undefined


  // Calculate other values
  const pc = parseInt(document.getElementById("instruction-address").value.split("x")[1], 16)
  const branchAddr = pc + 4 + parseSignedInt(immediate, 2) * 4

  const info = {
    op_code,
    fieldsNames: ["COD. OP", "RS", "RD", "IMMEDIATE"],
    fieldsBits: [op_code, rs, rd, immediate],
    mnemonic: i_opCode[op_code],
    nextAddr: pc + 4,
    branchAddr,
    type: "I",
    instruction: `<kbd>${i_opCode[op_code].toLowerCase()} ${registers_table[rd]}, ${registers_table[rs]}, ${parseSignedInt(immediate, 2)}</kbd>`,
  }

  // Special case for instructions type I parameters
  switch (info.mnemonic) {
    case "LUI":
      info.instruction = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rd]}, 0x${parseSignedInt(immediate, 2).toString(16).padStart(8, "0")}</kbd>`
      break
    case "SW":
    case "LW":
      info.instruction = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rd]}, ${parseSignedInt(immediate, 2)}(${registers_table[rs]})</kbd>`
      break
    case "BEQ":
    case "BGE":
    case "BGT":
    case "BLE":
    case "BLT":
    case "BGTZ":
    case "BLEZ":
    case "BLTZ":
    case "BGEZ":
    case "BNE":
      info.instruction = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rs]}, ${registers_table[rd]}, someLabel</kbd> (${parseSignedInt(immediate, 2)})`
      break
  }

  updateTable([
    ["Instruction address ($PC)", `0x${pc.toString(16).padStart(8, "0")}`],
    ["Instruction code (little-endian)", `0x${instructionHex.toString(16).padStart(8, "0")}`],
    ["I-Type intructions syntax", "<kbd>mnemo rd, rs, immediate</kbd>"],
    ["Intruction disassembled", info.instruction],
    ["Type", "I-Type"],
    ["Fields names", info.fieldsNames.join(" | ")],
    ["Fields bits", info.fieldsBits.join(" | ")],
    ["Operand values", `Cod.Op=${parseInt(op_code, 2)} | RS=${parseInt(rs, 2)}  |  RD=${parseInt(rd, 2)}  |  IMMEDIATE=${parseSignedInt(immediate, 2)}`],
  ])

  // If it's a branch instruction, calculate the branch address
  if (info.mnemonic[0] === "B") {
    appendTable([["Branch to", `0x${branchAddr.toString(16).padStart(8, "0")}`]])
  }

  return info
}

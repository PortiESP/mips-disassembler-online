import { funcs, i_opCode, registers_table, j_opCode } from "../data/instruction_decode.js"
import updateTable, {resetTable, appendTable} from "./tables.js"
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
function parseInstructionInputValue(event) {
  const $element = document.getElementById("instruction-code")
  if ($element.value.length > 11) return ($element.value = $element.value.slice(0, 11))
  if ($element.value.match(/[0-9A-F]{8}/i)) return ($element.value = $element.value.slice(0, 8))

  $element.value = $element.value.replace(/[^0-9A-F\-]/gi, "")
  $element.value = $element.value.toUpperCase()

  if ($element.value.length === 11 || (!$element.value.includes("-") && $element.value.length === 8)) {
    return true
  } else {
    resetTable()
    return false
  }
}

function parseInstructionAddrInputValue(event) {
  const $element = document.getElementById("instruction-address")
  if ($element.value.length > 10) return ($element.value = $element.value.slice(0, 10))

  $element.value = $element.value.replace(/[^x0-9A-F]/gi, "")

  $element.value && localStorage.setItem("address", $element.value)

  if ($element.value.match(/0x[0-9A-F]{8}/i)) {
    return true
  } else {
    resetTable()
    return false
  }
}

function handleInput(e) {
  console.log("Instruction: " + document.getElementById("instruction-code").value || undefined)
  console.log("PC: " + document.getElementById("instruction-address").value || undefined)

  $instruction.style.color = "black"
  const isValidAddr = parseInstructionAddrInputValue(e)
  const isValidIns = parseInstructionInputValue(e)
  if (isValidAddr && isValidIns) parseInstructionCode()
}

function parseInstructionCode() {
  const $element = document.getElementById("instruction-code")
  $element.value = $element.value.replace(/-/g, "")
  $element.value = $element.value.replace(/(.{2})/g, "$1-")
  $element.value = $element.value.replace(/-$/, "")

  $element.value && localStorage.setItem("instruction", $element.value)

  const insCode = $element.value.split("-").reverse().join("")
  const instruction = parseInt(insCode, 16)
  const opcode = instruction >>> 26

  console.log("-----------------------------------------------------------------------------------")
  console.log("Instruction: 0x" + insCode)
  console.log("Opcode: " + opcode.toString(2).padStart(6, "0"))

  // Parse the instruction depending on the opcode
  let info = undefined
  if (opcode === 0x00) info = parseR(instruction)
  else if (opcode === 0x02 || opcode === 0x03) info = parseJ(instruction)
  else info = parseI(instruction)

  console.log("INFO", info)
}


// -----------------------------------------------------------------------------------------------------------------------------------------

// Parse R-Type instructions
function parseR(instruction) {
  console.log("Type R")

  // Get instruction fields
  const instructionBin = instruction.toString(2).padStart(32, "0")
  const op_code = instructionBin.slice(0, 6)
  const rs = instructionBin.slice(6, 11)
  const rt = instructionBin.slice(11, 16)
  const rd = instructionBin.slice(16, 21)
  const shamt = instructionBin.slice(21, 26)
  const funct = instructionBin.slice(26)

  // Other calculated values
  const pc = parseInt(document.getElementById("instruction-address").value.split("x")[1], 16)

  const info = {
    op_code,
    fieldsNames: ["COD. OP", "RS", "RT", "RD", "SHAMT", "FUNCT"],
    fieldsBits: [op_code, rs, rt, rd, shamt, funct],
    mnemonic: funcs[funct],
    nextAddr: pc + 4, // PC+4
    type: "R",
    instruction: `<kbd>${funcs[funct].toLowerCase()} ${registers_table[rd]}, ${registers_table[rs]}, ${registers_table[rt]}</kbd>`
  }

  // Special case for instructions parameters
  switch (info.mnemonic) {
    case "JR": info.instruction = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rs]}</kbd>`; break
    case "SLL":
    case "SRL": info.instruction = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rd]}, ${registers_table[rt]}, ${parseInt(shamt, 2)}</kbd>`; break
    case "JALR": info.instruction = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rs]}, ${registers_table[rd]}</kbd>`; break
    case "MFHI":
    case "MFLO": info.instruction = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rd]}</kbd>`; break
    case "MULT":
    case "MULTU":
    case "DIV":
    case "DIVU": info.instruction = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rs]}, ${registers_table[rt]}</kbd>`; break
    case "SYSCALL": info.instruction = `<kbd>${info.mnemonic.toLowerCase()}</kbd>`; break
  }

  updateTable([
    ["Instruction address", `0x${pc.toString(16).padStart(8, "0")}`],
    ["Instruction code", `0x${instruction.toString(16).padStart(8, "0")}`],
    ["Intruction pseudo-code", "<kbd>mnemo rd, rs, rt</kbd>"],
    ["Intruction", info.instruction],
    ["Type", "R-Type"],
    ["Fields names", info.fieldsNames.join(" | ")],
    ["Fields bits", info.fieldsBits.join(" | ")],
    ["Operand values", `Cod.Op=${parseInt(op_code, 2)} | RS=${parseInt(rs, 2)}  |  RT=${parseInt(rt, 2)}  |  RD=${parseInt(rd, 2)}  |  SHAMT=${parseInt(shamt, 2)}  |  FUNCT=${parseInt(funct, 2)}`],
  ])

  return info
}

// Parse J-Type instructions
function parseJ(instruction) {
  console.log("Type J")
  // Get instruction address
  const pc = parseInt(document.getElementById("instruction-address").value.split("x")[1], 16)

  // Get instruction fields
  const instructionBin = instruction.toString(2).padStart(32, "0")
  const op_code = instructionBin.slice(0, 6)
  const target = instructionBin.slice(6)

  const targetAddr = ((pc + 4) & 0xf0000000) | (parseInt(target, 2) << 2)

  const info = {
    op_code,
    fieldsNames: ["COD. OP", "TARGET"],
    fieldsBits: [op_code, target],
    address: targetAddr,
    mnemonic: j_opCode[op_code],
    nextAddr: `0x${targetAddr.toString(16).padStart(8, "0")}`,
    type: "J",
    instruction: `<kbd>${j_opCode[op_code].toLowerCase()} someLabel</kbd>`
  }

  // Special case for instructions type I parameters
  updateTable([
    ["Instruction address", `0x${pc.toString(16).padStart(8, "0")}`],
    ["Instruction code", `0x${instruction.toString(16).padStart(8, "0")}`],
    ["Intruction pseudo-code", "<kbd>mnemo someLabel</kbd>"],
    ["Intruction", info.instruction],
    ["Type", "J-Type"],
    ["Fields names", info.fieldsNames.join(" | ")],
    ["Fields bits", info.fieldsBits.join(" | ")],
    ["Operand values", `TARGET=${parseInt(target,2)}`],
    ["Jump to", `0x${info.nextAddr.toString(16).padStart(8, "0")}`],
  ])

  return info
}

// Parse I-Type instructions
function parseI(instruction) {
  console.log("Type I")
  
  // Get instruction fields
  const instructionBin = instruction.toString(2).padStart(32, "0")
  const op_code = instructionBin.slice(0, 6)
  const rs = instructionBin.slice(6, 11)
  const rd = instructionBin.slice(11, 16)
  const immediate = instructionBin.slice(16)

  // Calculate other values
  const pc = parseInt(document.getElementById("instruction-address").value.split("x")[1], 16)
  const branchAddr = pc + 4 + parseSignedInt(immediate, 2) * 4

  // Error handling
  if (i_opCode[op_code] === undefined) $instruction.style.color = "red"

  const info = {
    op_code,
    fieldsNames: ["COD. OP", "RS", "RD", "IMMEDIATE"],
    fieldsBits: [op_code, rs, rd, immediate],
    mnemonic: i_opCode[op_code],
    nextAddr: pc + 4,
    branchAddr,
    type: "I",
    instruction: `<kbd>${i_opCode[op_code].toLowerCase()} ${registers_table[rd]}, ${registers_table[rs]}, ${parseSignedInt(immediate, 2)}</kbd>`
  }

  // Special case for instructions type I parameters
  switch (info.mnemonic) {
    case "LUI": info.instruction = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rd]}, 0x${parseSignedInt(immediate, 2).toString(16).padStart(8, "0")}</kbd>`; break
    case "SW":
    case "LW": info.instruction = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rd]}, ${parseSignedInt(immediate, 2)}(${registers_table[rs]})</kbd>`; break
    case "BEQ":
    case "BGE":
    case "BGT":
    case "BLE":
    case "BLT":
    case "BGTZ":
    case "BLEZ":
    case "BLTZ":
    case "BGEZ":
    case "BNE": info.instruction = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rs]}, ${registers_table[rd]}, someLabel</kbd> (${parseSignedInt(immediate, 2)})`; break
  }

  updateTable([
    ["Instruction address", `0x${pc.toString(16).padStart(8, "0")}`],
    ["Instruction code", `0x${instruction.toString(16).padStart(8, "0")}`],
    ["Intruction pseudo-code", "<kbd>mnemo rd, rs, immediate</kbd>"]
    ["Intruction", info.instruction],
    ["Type", "I-Type"],
    ["Fields names", info.fieldsNames.join(" | ")],
    ["Fields bits", info.fieldsBits.join(" | ")],
    ["Operand values", `Cod.Op=${parseInt(op_code, 2)} | RS=${parseInt(rs, 2)}  |  RD=${parseInt(rd, 2)}  |  IMMEDIATE=${parseSignedInt(immediate, 2)}`],
  ])

  // If it's a branch instruction, calculate the branch address
  if (info.mnemonic[0] === "B") {
    appendTable([
      ["Branch to", `0x${branchAddr.toString(16).padStart(8, "0")}`],
    ])
  }

  return info
}
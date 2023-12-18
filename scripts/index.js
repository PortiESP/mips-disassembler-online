import { funcs, i_opCode, registers_table, j_opCode } from "../data/instruction_decode.js"

const $instruction = document.getElementById("instruction-code")
const $instructionAddr = document.getElementById("instruction-address")

// Event
$instruction.addEventListener("blur", (e)=>{
  e.target.value = e.target.value.replace(/-/g, "")
  e.target.value = e.target.value.replace(/(.{2})/g, "$1-")
  e.target.value = e.target.value.replace(/-$/, "")
  handleInput(e)
})
$instruction.addEventListener("input", handleInput)
$instructionAddr.addEventListener("input", handleInput)

// Initial
$instruction.value = localStorage.getItem("instruction") || ""
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

  document.getElementById("table-ins-addr").innerHTML = document.getElementById("instruction-address").value
  document.getElementById("table-ins-codehex").innerHTML = "0x" + insCode

  console.log("-----------------------------------------------------------------------------------")
  console.log("Instruction: 0x" + insCode)
  console.log("Opcode: " + opcode.toString(2).padStart(6, "0"))

  // Parse the instruction depending on the opcode
  let info = undefined
  if (opcode === 0x00) info = parseR(instruction)
  else if (opcode === 0x02 || opcode === 0x03) info = parseJ(instruction)
  else info = parseI(instruction)

  // Update the next instruction address
  document.getElementById("next-ins-addr").innerHTML = `<kbd>0x${info.nextAddr.toString(16).padStart(8, "0")}</kbd>`
  if (info.type === "I") document.getElementById("next-ins-addr").innerHTML += ` (PC+4), Si se cumple la condición: <kbd>0x${info.branchAddr.toString(16).padStart(8, "0")}</kbd>`


  console.log("INFO", info)
}

function resetTable() {
  document.getElementById("table-ins-addr").innerHTML = "Invalid addr or instruction"
  document.getElementById("table-ins-codehex").innerHTML = "Invalid addr or instruction"
  document.getElementById("table-ins").innerHTML = "Invalid addr or instruction"
  document.getElementById("table-mnemo").innerHTML = "Invalid addr or instruction"
  document.getElementById("table-type").innerHTML = "Invalid addr or instruction"
  document.getElementById("table-fields").innerHTML = "Invalid addr or instruction"
  document.getElementById("table-bits").innerHTML = "Invalid addr or instruction"
  document.getElementById("table-regs-values").innerHTML = "Invalid addr or instruction"
  document.getElementById("next-ins-addr").innerHTML = "Invalid addr or instruction"
}

// -----------------------------------------------------------------------------------------------------------------------------------------

// Parse R-Type instructions
function parseR(instruction) {
  console.log("Type R")
  const instructionBin = instruction.toString(2).padStart(32, "0")
  const op_code = instructionBin.slice(0, 6)
  const rs = instructionBin.slice(6, 11)
  const rt = instructionBin.slice(11, 16)
  const rd = instructionBin.slice(16, 21)
  const shamt = instructionBin.slice(21, 26)
  const funct = instructionBin.slice(26)
  const pc = parseInt(document.getElementById("instruction-address").value.split("x")[1], 16)


  const info = {
    op_code,
    fields: [op_code, rs, rt, rd, shamt, funct],
    mnemonic: funcs[funct],
    nextAddr: pc + 4,  // PC+4
    type: "R",
  }

  // Special case for instructions parameters
  if (info.mnemonic === "JR")
    document.getElementById("table-ins").innerHTML = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rs]}}</kbd>`
  else if (info.mnemonic === "SLL" || info.mnemonic === "SRL")
    document.getElementById("table-ins").innerHTML = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rd]}, ${registers_table[rt]}, ${parseInt(shamt, 2)}</kbd>`
  else if (info.mnemonic === "JALR")
    document.getElementById("table-ins").innerHTML = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rs]}, ${registers_table[rd]}</kbd>`
  else if (info.mnemonic === "MFHI" || info.mnemonic === "MFLO")
    document.getElementById("table-ins").innerHTML = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rd]}</kbd>`
  else if (info.mnemonic === "SYSCALL")
    document.getElementById("table-ins").innerHTML = `<kbd>${info.mnemonic.toLowerCase()}</kbd>`
  else if (info.mnemonic === "MULT" || info.mnemonic === "MULTU" || info.mnemonic === "DIV" || info.mnemonic === "DIVU")
    document.getElementById("table-ins").innerHTML = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rs]}, ${registers_table[rt]}</kbd>`
  else
    document.getElementById("table-ins").innerHTML = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rd]}, ${registers_table[rs]}, ${registers_table[rt]}</kbd>`
  document.getElementById("table-mnemo").innerHTML = info.mnemonic
  document.getElementById("table-type").innerHTML = "Tipo R"
  document.getElementById("table-fields").innerHTML = "COD. OP | RS | RT | RD | SHAMT | FUNCT"
  document.getElementById("table-bits").innerHTML = info.fields.join(" ")
  const registers = `RS=${registers_table[rs]}(${parseInt(rs, 2)})  |  RT=${registers_table[rt]}(${parseInt(rt, 2)})  |  RD=${registers_table[rd]}(${parseInt(rd, 2)})`
  document.getElementById("table-regs-values").innerHTML = registers

  return info
}

// Parse J-Type instructions
function parseJ(instruction) {
  console.log("Type J")
  // Get instruction address
  const pc = parseInt(document.getElementById("instruction-address").value.split("x")[1], 16)

  const instructionBin = instruction.toString(2).padStart(32, "0")
  const op_code = instructionBin.slice(0, 6)
  const target = instructionBin.slice(6)

  const info = {
    op_code,
    fields: [op_code, target],
    address: ((pc + 4) & 0xf0000000) | parseInt(target, 2) << 2,
    mnemonic: j_opCode[op_code],
    nextAddr: ((pc + 4) & 0xf0000000) | parseInt(target, 2) << 2,
    type: "J",
  }

  // Special case for instructions type I parameters
  document.getElementById("table-ins").innerHTML = `<kbd>${info.mnemonic.toLowerCase()} 0x${info.address.toString(16).padStart(8, "0")}</kbd>`
  document.getElementById("table-mnemo").innerHTML = info.mnemonic
  document.getElementById("table-type").innerHTML = "Tipo J"
  document.getElementById("table-fields").innerHTML = "COD. OP | TARGET"
  document.getElementById("table-bits").innerHTML = info.fields.join(" ")
  document.getElementById("table-regs-values").innerHTML = "TARGET=0x" + parseInt(target, 2).toString(16).padStart(8, "0")
  // Custom row
  if (!document.getElementById("table-jump-to")) document.getElementById("table-body").innerHTML += `<tr><td><b>Jump to</b></td><td id="table-jump-to">0x${info.address.toString(16).padStart(8, "0")}</td></tr>`
  else document.getElementById("table-jump-to").innerHTML = `0x${info.address.toString(16).padStart(8, "0")}`

  return info
}

// Parse I-Type instructions
function parseI(instruction) {
  console.log("Type I")
  const instructionBin = instruction.toString(2).padStart(32, "0")
  const op_code = instructionBin.slice(0, 6)
  const rs = instructionBin.slice(6, 11)
  const rd = instructionBin.slice(11, 16)
  const immediate = instructionBin.slice(16)
  const pc = parseInt(document.getElementById("instruction-address").value.split("x")[1], 16)
  const branchAddr = (pc + 4) + (parseSignedInt(immediate, 2) * 4)

  // Error handling
  if (i_opCode[op_code] === undefined) $instruction.style.color = "red"

  const info = {
    op_code,
    fields: [op_code, rs, rd, immediate],
    mnemonic: i_opCode[op_code],
    nextAddr: pc + 4,
    branchAddr,
    type: "I",
  }

  if (info.mnemonic === "LUI")
    document.getElementById("table-ins").innerHTML = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rd]}, 0x${parseSignedInt(immediate, 2).toString(16).padStart(8, "0")}</kbd>`
  else if (info.mnemonic === "LW" || info.mnemonic === "SW")
    document.getElementById("table-ins").innerHTML = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rd]}, ${parseSignedInt(immediate, 2)}(${registers_table[rs]})</kbd>`
  else if (info.mnemonic === "BEQ" || info.mnemonic === "BNE")
    document.getElementById("table-ins").innerHTML = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rs]}, ${registers_table[rd]}, someLabel</kbd> (${parseSignedInt(immediate, 2)})`
  else
    document.getElementById("table-ins").innerHTML = `<kbd>${info.mnemonic.toLowerCase()} ${registers_table[rd]}, ${registers_table[rs]}, ${parseSignedInt(immediate, 2)}</kbd>`
  document.getElementById("table-mnemo").innerHTML = info.mnemonic
  document.getElementById("table-type").innerHTML = "Tipo I"
  document.getElementById("table-fields").innerHTML = "COD. OP | RS | RD | IMMEDIATE"
  document.getElementById("table-bits").innerHTML = info.fields.join(" ")
  // Custom row
  const registers = `RS=${registers_table[rs]}(${parseInt(rs, 2)})  |  RD=${registers_table[rd]}(${parseInt(rd, 2)})  |  IMMEDIATE=${parseSignedInt(immediate, 2)}`
  if (!document.getElementById("table-regs-values")) document.getElementById("table-body").innerHTML += `<tr><td><b>Register values</b></td><td id="table-regs-values">${registers}</td></tr>`
  else document.getElementById("table-regs-values").innerHTML = registers

  // If it's a branch instruction, calculate the branch address
  if (info.mnemonic[0] === "B"){
    if (!document.getElementById("table-branch-to")) document.getElementById("table-body").innerHTML += `<tr ><td><b>Branch to</b></td><td id="table-branch-to">0x${branchAddr.toString(16).padStart(8, "0")}</td></tr>`
    else document.getElementById("table-branch-to").innerHTML = `0x${branchAddr.toString(16).padStart(8, "0")}`
  }
  

  return info
}


function parseSignedInt(str, base) {
  const num = parseInt(str, base);
  const msb = 1 << (str.length - 1);
  return num >= msb ? num - (msb << 1) : num;
}
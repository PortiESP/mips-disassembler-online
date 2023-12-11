
const $instruction = document.getElementById("instruction-code")
const $instructionAddr = document.getElementById("instruction-address")

// Event
$instruction.addEventListener("input", parseInstructionInputValue)
$instructionAddr.addEventListener("input", parseInstructionAddrInputValue)

function parseInstructionInputValue(event){
    let value = event.target.value
    if (value.length > 11) return event.target.value = value.slice(0, 11)

    value = value.replace(/-/g, "")
    value = value.replace(/[^0-9A-F]/gi, "")
    value = value.replace(/(.{2})/g, "$1-")
    value = value.replace(/-$/, "")
    event.target.value = value.toUpperCase()


    if (value.length === 11) {
        const instructionHex = value.split("-").reverse().join("")
        handleInput(instructionHex)
    }
}

parseInstructionInputValue({target: {value: $instruction.value}})



function parseInstructionAddrInputValue(event){
    let value = event.target.value
    if (value.length > 10) return event.target.value = value.slice(0, 10)

    value = value.replace(/[^x0-9A-F]/gi, "")
    event.target.value = value

    console.log(value.match(/0x[0-9A-F]{8}/i))
    if (value.match(/0x[0-9A-F]{8}/i)) {
      const instructionCode = document.getElementById("instruction-code").value.split("-").reverse().join("")
      handleInput(instructionCode)
    }

}



function handleInput(instructionHex){
  console.log("Instruction: 0x" + instructionHex)
  console.log("PC: " + document.getElementById("instruction-address").value.split("x")[1])

  const _ = [...document.querySelectorAll(".hex-instruction")].map(e => e.innerHTML =  "0x" + instructionHex) 

  parseInstructionCode(instructionHex)
}


function parseInstructionCode(hex){
  const instruction = parseInt(hex, 16)
  const opcode = instruction >>> 26

  document.getElementById("table-ins-addr").innerHTML = document.getElementById("instruction-address").value
  document.getElementById("table-ins-code").innerHTML = "0x" + hex

  // Parse the instruction depending on the opcode
  let info = undefined
  if (opcode === 0x00) info = parseR(instruction)
  else if (opcode === 0x02 || opcode === 0x03) info = parseJ(instruction)
  else info = parseI(instruction)

  console.log(info)
  

}



// Parse R-Type instructions
function parseR(instruction){
  const instructionBin = instruction.toString(2).padStart(32, "0")
  const op_code = instructionBin.slice(0, 6)
  const rs = instructionBin.slice(6, 11)
  const rt = instructionBin.slice(11, 16)
  const rd = instructionBin.slice(16, 21)
  const shamt = instructionBin.slice(21, 26)
  const funct = instructionBin.slice(26)

  const info = {
    op_code,
    fields: [op_code, rs, rt, rd, shamt, funct],
  }

  document.getElementById("table-mnemo").innerHTML = "R-Type"
}



// Parse J-Type instructions
function parseJ(instruction){
  // Get instruction address
  const pc = parseInt(document.getElementById("instruction-address").value.split("x")[1], 16) 

  const instructionBin = instruction.toString(2).padStart(32, "0")
  const op_code = instructionBin.slice(0, 6)
  const target = instructionBin.slice(6)

  const info = {
    op_code,
    fields: [op_code, target],
    address: pc+4 | parseInt(target, 2) << 2,
    mnemonic: op_code ? "j" : "jal"
  }

  document.getElementById("table-mnemo").innerHTML = info.mnemonic
  document.getElementById("table-bits").innerHTML = info.fields.join(" ")
  if (!document.getElementById("table-jump-to")) document.getElementById("table-body").innerHTML += `<tr id="table-jump-to"><td><b>Jump to</b></td><td>0x${info.address.toString(16)}</td></tr>`
  else document.getElementById("table-jump-to").innerHTML = `<td><b>Jump to</b></td><td>0x${info.address.toString(16)}</td>`

  return info
  
}







// Parse I-Type instructions
function parseI(instruction){

}
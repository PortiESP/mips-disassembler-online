
const $instruction = document.getElementById("instruction-code")




// Event
$instruction.addEventListener("input", instructionUpdate)

function instructionUpdate(event){
    let value = event.target.value
    if (value.length > 11) return event.target.value = value.slice(0, 11)

    value = value.replace(/-/g, "")
    value = value.replace(/[^0-9A-F]/gi, "")
    value = value.replace(/(.{2})/g, "$1-")
    value = value.replace(/-$/, "")
    event.target.value = value.toUpperCase()

    // Hide the cycles
    document.getElementById("ciclo-id").style.display = "none"

    if (value.length === 11) {
        const instructionHex = value.split("-").reverse().join("")
        parseInstruction(instructionHex)
    }
}

instructionUpdate({target: {value: $instruction.value}})


function parseInstruction(instructionHex){
  console.log("Instruction: 0x" + instructionHex)

  // Show the cycles
  document.getElementById("ciclo-id").style.display = "block"

  const _ = [...document.querySelectorAll(".hex-instruction")].map(e => e.innerHTML =  "0x" + instructionHex) 

  parseID(instructionHex)
}


function parseID(hex){
  const instruction = parseInt(hex, 16)
  const opcode = instruction >>> 26

  // Parse the instruction depending on the opcode
  if (opcode === 0x00) {
    parseR(instruction)
  } else if (opcode === 0x02 || opcode === 0x03) {
    parseJ(instruction)
  } else {
    parseI(instruction)
  }
}

function parseR(){
  
}
function parseJ(){

}
function parseI(){

}
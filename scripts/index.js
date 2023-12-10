
const $instruction = document.getElementById("instruction")

// Event
$instruction.addEventListener("input", instructionUpdate)

function instructionUpdate(event){
    let value = event.target.value
    if (value.length > 11) return event.target.value = value.slice(0, 11)

    value = value.replace(/-/g, "")
    value = value.replace(/(.{2})/g, "$1-")
    value = value.replace(/-$/, "")
    event.target.value = value

    if (value.length === 11) {
        const instructionAddr = value.split("-").reverse().join("")
        parseInstruction(instructionAddr)
    }
}



function parseInstruction(pc){
  console.log("Instruction: 0x" + pc)

  document.querySelector("#little-endian > span").innerHTML = "0x"+pc
}
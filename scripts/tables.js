export default function updateTable(data) {
  // Remove error message
  document.querySelector("#error-msg").innerHTML = ""
  
  // Get the table
  const $table = document.querySelector("table")
  // Remove all rows
  $table.querySelectorAll("tr").forEach((e) => e.remove())
  // Add the rows
  data.forEach((row) => ($table.innerHTML += `<td>${row[0]}</td><td>${row[1]}</td>`))
}


export function appendTable(data){
  // Get the table
  const $table = document.querySelector("table")
  // Add the rows
  data.forEach((row) => ($table.innerHTML += `<td>${row[0]}</td><td>${row[1]}</td>`))
}


// Reset table to default
export function resetTable() {
  const $table = document.querySelector("table")
  $table.querySelectorAll("tr").forEach((e) => e.remove())
  document.querySelector("#error-msg").innerHTML = "Invalid input"
  
}
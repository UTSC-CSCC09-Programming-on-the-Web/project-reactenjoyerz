export function validateNumber(num) {
  return num !== null && num !== undefined && num !== "" && !isNaN(num) && typeof num === "number";
}

export function validateString(str) {
  return (
    str !== null && str !== undefined && typeof str === "string" && str !== ""
  );
}

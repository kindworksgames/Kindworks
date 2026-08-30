export function runHouseRescueQaCompletion({ qaMode, houseRescue, setMessage, showResult }) {
  if (qaMode !== true) {
    setMessage("Certified QA completion is unavailable.", "error");
    return false;
  }
  const result = houseRescue.qaComplete();
  if (!result.ok) {
    setMessage(result.message, "error");
    return false;
  }
  showResult(result.result);
  return true;
}

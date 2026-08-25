// -----------------------------------------------------------------------------
// Career Manager Clipper - Popup Controller
// -----------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
  const titleInput = document.getElementById("job-title");
  const companyInput = document.getElementById("company-name");
  const locationInput = document.getElementById("location");
  const remoteInput = document.getElementById("remote");
  const techStackInput = document.getElementById("tech-stack");
  const saveBtn = document.getElementById("save-btn");
  const statusDiv = document.getElementById("status");

  let currentSourceUrl = "";
  let currentDescription = "";
  let backendUrl = "http://localhost:3000";

  // 1. Hole aktiven Tab und sende Nachricht an Content Script
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      currentSourceUrl = tab.url || "";
      chrome.tabs.sendMessage(tab.id, { action: "GET_JOB_DATA" }, (response) => {
        if (chrome.runtime.lastError || !response) {
          // Fallback, falls Script noch nicht geladen war
          titleInput.value = tab.title?.replace(/\|.*$/, "").trim() || "";
          return;
        }

        titleInput.value = response.title || "";
        companyInput.value = response.companyName || "";
        locationInput.value = response.location || "";
        remoteInput.value = response.remote ? "Ja (Remote/Hybrid)" : "Vor Ort";
        techStackInput.value = response.techStack || "";
        currentDescription = response.description || "";
      });
    }
  } catch (err) {
    statusDiv.className = "status error";
    statusDiv.textContent = "Fehler beim Lesen des Tabs.";
  }

  // 2. Klick-Handler zum Speichern in der lokalen REST-API
  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    statusDiv.className = "status";
    statusDiv.textContent = "Speichere in Datenbank...";

    const payload = {
      title: titleInput.value.trim() || "Frontend Entwickler",
      companyName: companyInput.value.trim() || "Unbekanntes Unternehmen",
      location: locationInput.value.trim() || "Bonn",
      remote: remoteInput.value.toLowerCase().includes("ja") || remoteInput.value.toLowerCase().includes("remote"),
      techStack: techStackInput.value.trim() || "TypeScript, React, Next.js",
      description: currentDescription || `Erfasst via Browser-Extension von ${currentSourceUrl}`,
      portalSource: "OTHER",
      sourceUrl: currentSourceUrl,
      requirementsProfile: `Anforderungen: ${techStackInput.value.trim()}`,
    };

    try {
      const res = await fetch(`${backendUrl}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        statusDiv.className = "status success";
        statusDiv.textContent = "✓ Erfolgreich im Dashboard gespeichert!";
        setTimeout(() => window.close(), 1800);
      } else {
        const data = await res.json();
        statusDiv.className = "status error";
        statusDiv.textContent = data.error || "Fehler beim Speichern.";
        saveBtn.disabled = false;
      }
    } catch (error) {
      statusDiv.className = "status error";
      statusDiv.textContent = "Dashboard nicht erreichbar (localhost:3000 läuft nicht?).";
      saveBtn.disabled = false;
    }
  });
});

document.getElementById('csvFile').addEventListener('change', function () {
  const fileName = this.files[0] ? this.files[0].name : "No file chosen";
  document.getElementById('fileName').textContent = fileName;
});

document.getElementById('uploadForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const fileInput = document.getElementById('csvFile');
  const fieldName = document.getElementById('fieldName').value;
  const separator = document.getElementById('separator').value;
  const fileType = document.getElementById('fileType').value;
  const download = document.getElementById('downloadFile').checked;
  const resultContainer = document.getElementById('result');
  const dataCount = document.getElementById('dataCount');

  if (!fileInput.files.length) {
      alert("Please select a CSV file.");
      return;
  }

  resultContainer.innerHTML = "<p>Processing...</p>";

  try {
      const formData = new FormData();
      formData.append('csv', fileInput.files[0]);
      formData.append('field', fieldName);
      formData.append('separator', separator);
      formData.append('fileType', fileType);
      formData.append('download', download);

      const response = await fetch('/upload', { method: 'POST', body: formData });

      if (!response.ok) throw new Error("Error processing the file");

      const data = await response.json();
      dataCount.textContent = data.extracted.length;
      resultContainer.innerHTML = data.extracted.map(item => `<p>${item}</p>`).join("");

  } catch (error) {
      resultContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
});

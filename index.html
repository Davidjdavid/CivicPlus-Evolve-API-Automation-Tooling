<!DOCTYPE html>
<html>
    <head>
        <link rel="stylesheet" href="/style.css">
    </head>
    <body>
        <div id="instructions">
            <p><b>Instructions on how to use this tool:</b></p>        
        </div>

        <div id="mainDashboard">
            <h1>Upload articles to Evolve site</h1>
            <div id="inputDiv">
                <label for="inputURL">Website URL:</label>
                <input type="text" id="inputURL"><br>
                
                <label for="inputToken">Token:</label>
                <input type="text" id="inputToken" value=""><br>
            </div>


            <div id="buttonsDiv">
                <button id="uploadBtn">Upload articles</button>
            </div>
            <div id="resultsDiv">
                <p id="results">Results: N/A</p>
            </div>
        </div>

<script>
            const resultsField = document.getElementById('results');
            const uploadBtn = document.getElementById('uploadBtn');

            uploadBtn.onclick = async () => {
                uploadBtn.disabled = true;
                resultsField.innerText = 'Please wait...';

                const inputValues = {
                    url: document.getElementById('inputURL').value,
                    apiKey: document.getElementById('inputToken').value
                };
                
                try {
                    const response = await fetch('/uploadBtn', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(inputValues) 
                    });

                    if (response.ok) {
                        const data = await response.json();
                        document.getElementById('results').innerText = data.message;
                    }
                } finally {
                    setTimeout(() => {
                        uploadBtn.disabled = false;
                    }, 3000);
                }
            };
        </script>
    </body>
</html>

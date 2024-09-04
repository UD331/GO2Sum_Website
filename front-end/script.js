fetch('go_terms.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(goTerms => {
        initializeSearchBar('searchTerms1', goTerms);
        //initializeSearchBar('searchTerms2', goTerms);
    })
    .catch(error => console.error('Error reading file:', error));

function initializeSearchBar(searchBarId, goTerms) {
    const searchBar = document.getElementById(searchBarId);
    if (!searchBar) {
        console.error(`No search bar found with ID ${searchBarId}`);
        return;
    }
    searchBar.addEventListener('input', showSuggestions.bind(null, searchBarId, goTerms));
    searchBar.addEventListener('keydown', handleKeyDown.bind(null, searchBarId));
}

function showSuggestions(searchBarId, goTerms, event) {
    const input = event.target.value.toLowerCase();
    
    const suggestions = getFilteredSuggestions(goTerms, input);

    const dataListId = `${searchBarId}_suggestions`;
    let dataList = document.getElementById(dataListId);
    if (!dataList) {
        console.error(`No datalist found for ${searchBarId}`);
        return;
    }

    dataList.innerHTML = ''; // Clear previous options

    const MAX_SUGGESTIONS = 10; // Maximum number of suggestions to display
    suggestions.slice(0, MAX_SUGGESTIONS).forEach(suggestion => {
        const option = document.createElement('option');
        option.value = suggestion.id; // Display ID
        option.textContent = `${suggestion.id} - ${suggestion.name}`; // Display ID and Name
        dataList.appendChild(option);
    });
}


function getFilteredSuggestions(goTerms, input) {
    
    if (!input) {
        console.log('Input is empty, returning empty array');
        return [];
    }

    const filtered = goTerms.filter(term => {
        const termId = term.id.toLowerCase();
        //const termName = term.name.toLowerCase();
        return termId.includes(input);
    });
    
    return filtered;
}



function handleRemoveTerm(selectedTermContainer, termElement, removeButton) {
    termElement.remove(); // Remove the term element from the container
    removeButton.remove(); // Remove the corresponding remove button
}

function handleKeyDown(searchBarId, event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const searchBar = document.getElementById(searchBarId);
        const selectedTermsContainer = document.getElementById(`selectedTerms${searchBarId.slice(-1)}`);
        const input = searchBar.value.trim();
        if (input) {
            const selectedTerm = document.createElement('span');
            selectedTerm.textContent = input + ";";

            const removeButton = document.createElement('button');
            removeButton.textContent = ''; // Close symbol
            removeButton.onclick = function() {
                handleRemoveTerm(selectedTermsContainer, selectedTerm, removeButton); 
            };

            // Append term and remove button to container
            selectedTermsContainer.appendChild(selectedTerm);
            selectedTermsContainer.appendChild(removeButton)

            // Clear input
            searchBar.value = '';

            // Clear suggestions
            const dataList = document.getElementById(`${searchBarId}_suggestions`);
            if (dataList) {
                dataList.innerHTML = ''; // Just clear the inner HTML instead of removing it
            }
        }
    }
}


// Add this event listener to handle clicks on suggestions
document.addEventListener('click', function(event) {
    const clickedOption = event.target.closest('option');
    if (clickedOption) {
        const inputField = clickedOption.parentElement.previousElementSibling;
        if (inputField && inputField.tagName === 'INPUT') {
            const selectedTermsContainer = document.getElementById(`selectedTerms${inputField.id.slice(-1)}`);
            const selectedTerm = document.createElement('span');
            selectedTerm.textContent = clickedOption.value + ";";
            selectedTermsContainer.appendChild(selectedTerm);
            inputField.value = ''; // Clear the input field
        }
    }
});



function generateSummary() {
    var searchBar1Input = document.getElementById('selectedTerms1').textContent.trim();
    //var searchBar2Input = document.getElementById('selectedTerms2').textContent.trim();
    var combinedInput = "";
    if (!searchBar1Input || searchBar1Input == '') {
        combinedInput = '';
    } else {
        combinedInput += "Protein\tGO_IDs\nsearchBarProtein\t" + searchBar1Input + '\n';
    }

    var inputFile = document.getElementById('inputFile').files[0];
    var manualInput = document.getElementById('manualInput').value.trim();

    if (!inputFile && !manualInput && !combinedInput) {
        alert('Please select an input file or enter input manually.');
        return;
    }

    var summaryTypes = [];
    document.querySelectorAll('input[name="summaryType"]:checked').forEach(function(checkbox) {
        summaryTypes.push(checkbox.value);
    });

    if (summaryTypes.length === 0) {
        alert('Please select at least one summary type.');
        return;
    }

    var email = document.getElementById('emailInput').value.trim();

    var outputBox = document.getElementById('output');
    outputBox.innerHTML = '<p>Generating Summary...</p>';

    var formData = new FormData();
    if (inputFile) {
        formData.append('input_file', inputFile);
    } else if (manualInput && manualInput !== '') {
            var blob = new Blob([manualInput], { type: 'text/plain' });
            formData.append('input_file', blob, 'input.tab');
        
    } else {
        if (combinedInput && combinedInput !== '') {
            var blob = new Blob([combinedInput], { type: 'text/plain' });
                formData.append('input_file', blob, 'input.tab');
        }
    }
    formData.append('summary_types', summaryTypes.join(','));
    formData.append('output_file', 'output.txt');

    if (email) {
        formData.append('email', email);
    }

    $.ajax({
        url: '/generate_summary',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            console.log('Response data:', response);
            if (response.success) {
                var lines = response.result.split('\n');
                var resultHTML = '<p>Summary generated successfully.</p>';
                resultHTML += '<p>Result:</p>';
                lines.forEach(function(line) {
                    if (line.startsWith('---')) {
                        resultHTML += '<p><strong>' + line + '</strong></p>';
                    } else {
                        resultHTML += '<p>' + line + '</p>';
                    }
                });
                outputBox.innerHTML = resultHTML;

                if (email) {
                    alert('The summary has been sent to your email!');
                }
                document.getElementById('emailInput').value = '';

                document.querySelectorAll('input[name="summaryType"]:checked').forEach(function(checkbox) {
                    checkbox.checked = false;
                });
                // Clear manual input
                document.getElementById('manualInput').value = '';
                document.getElementById('selectedTerms1').textContent = '';
                document.getElementById('selectedTerms2').textContent = '';
                // Clear file input
                document.getElementById('inputFile').value = '';
            } else {
                outputBox.innerHTML = '<p>Failed to generate summary: Please try again with a separate input.</p>';
                document.querySelectorAll('input[name="summaryType"]:checked').forEach(function(checkbox) {
                    checkbox.checked = false;
                });
                // Clear manual input
                document.getElementById('manualInput').value = '';

                // Clear file input
                document.getElementById('inputFile').value = '';

                document.getElementById('selectedTerms1').textContent = '';
                document.getElementById('selectedTerms2').textContent = '';
            }
        },
        error: function(error) {
            console.error('Error:', error);
            outputBox.innerHTML = '<p>An error occurred. Please try again later.</p>';
            document.querySelectorAll('input[name="summaryType"]:checked').forEach(function(checkbox) {
                checkbox.checked = false;
            });
            // Clear manual input
            document.getElementById('manualInput').value = '';
            document.getElementById('selectedTerms1').textContent = '';
            document.getElementById('selectedTerms2').textContent = '';
            // Clear file input
            document.getElementById('inputFile').value = '';
        }
    });
}


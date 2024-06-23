import React, { useEffect } from 'react';
import './App.css';
import './scripts.js'; // 기존 JS 파일을 src 폴더로 이동시키고 import 합니다.

function App() {
  useEffect(() => {
    // 기존 스크립트의 로직을 여기에 넣습니다.
    loadReviews();

    const stockInput = document.getElementById('stockName');
    const suggestionsBox = document.getElementById('autocomplete-list');

    stockInput.oninput = function() {
        this.value = this.value.toUpperCase();
    };

    // 자동 완성 기능 추가
    $(stockInput).autocomplete({
        source: function(request, response) {
            $.ajax({
                url: "/api/get_tickers",
                method: "GET",
                dataType: "json",
                success: function(data) {
                    var filteredData = $.map(data, function(item) {
                        if (item.Symbol.toUpperCase().includes(request.term.toUpperCase()) ||
                            item.Name.toUpperCase().includes(request.term.toUpperCase())) {
                            return {
                                label: item.Symbol + " - " + item.Name + " - " + item.Market + " - " + item.Sector + " - " + item.Industry,
                                value: item.Symbol
                            };
                        } else {
                            return null;
                        }
                    });
                    response(filteredData);
                },
                error: function() {
                    console.error("Error fetching tickers");
                }
            });
        },
        select: function(event, ui) {
            stockInput.value = ui.item.value;
            document.getElementById('searchReviewButton').click();
            return false;
        }
    });

    stockInput.onkeypress = function(e) {
        if (e.which === 13) { // Enter key
            document.getElementById('searchReviewButton').click();
            return false;
        }
    };

    document.getElementById('searchReviewButton').onclick = function() {
        const stockName = stockInput.value.toUpperCase();
        const reviewList = document.getElementById('reviewList');
        const reviewItems = reviewList.getElementsByClassName('review');
        let stockFound = false;

        Array.from(reviewItems).forEach(function(reviewItem) {
            if (reviewItem.getElementsByTagName('h3')[0].innerText.includes(stockName)) {
                reviewItem.scrollIntoView({ behavior: 'smooth' });
                stockFound = true;
                return false;
            }
        });

        if (!stockFound) {
            saveToSearchHistory(stockName);
            alert('Review is being prepared. Please try again later.');
        }
    };

    function loadReviews() {
        const reviewList = document.getElementById('reviewList');

        $.getJSON('/static/images/', function(data) {
            $.each(data, function(index, file) {
                if (file.name.startsWith('comparison_') && file.name.endsWith('.png')) {
                    const stockName = file.name.replace('comparison_', '').replace('_VOO.png', '').toUpperCase();
                    const newReview = document.createElement('div');
                    newReview.className = 'review';
                    newReview.innerHTML = `
                        <h3>${stockName} vs VOO</h3>
                        <img id="image-${stockName}" src="/static/images/${file.name}" alt="${stockName} vs VOO" style="width: 100%;">
                    `;
                    reviewList.appendChild(newReview);
                    document.getElementById(`image-${stockName}`).onclick = function() {
                        showMplChart(stockName);
                    };
                }
            });
        }).fail(function() {
            console.error('Error fetching the file list');
        });
    }

    function showMplChart(stockName) {
        const url = `/static/images/result_mpl_${stockName}.png`;
        window.open(url, '_blank');
    }

    function saveToSearchHistory(stockName) {
        $.ajax({
            url: '/save_search_history',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ stock_name: stockName }),
            success: function(data) {
                if (data.success) {
                    console.log(`Saved ${stockName} to search history.`);
                } else {
                    console.error('Failed to save to search history.');
                }
            },
            error: function() {
                console.error('Error saving to search history');
            }
        });
    }
  }, []);

  return (
    <div className="App">
      <h1>Stock Comparison Review</h1>
      <label htmlFor="stockName">Stock name:</label>
      <input type="text" id="stockName" name="stockName" />
      <button id="searchReviewButton">Search Review</button>
      <div id="reviewList"></div>
    </div>
  );
}

export default App;

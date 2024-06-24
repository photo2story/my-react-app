import React, { useState, useEffect } from 'react';
import $ from 'jquery';
import 'jquery-ui/ui/widgets/autocomplete';
import './App.css';

function App() {
    const [stockName, setStockName] = useState('');

    useEffect(() => {
        const stockInput = $('#stockName');

        stockInput.on('input', function() {
            this.value = this.value.toUpperCase();
        });

        stockInput.autocomplete({
            source: function(request, response) {
                $.ajax({
                    url: "/api/get_tickers", // Adjust the URL as per your backend route
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
                stockInput.val(ui.item.value);
                $('#searchReviewButton').click();
                return false;
            }
        });

        stockInput.on('keypress', function(e) {
            if (e.which === 13) { // Enter key
                $('#searchReviewButton').click();
                return false;
            }
        });

        $('#searchReviewButton').click(function() {
            const stockName = stockInput.val().toUpperCase();
            const reviewList = $('#reviewList');
            const reviewItems = reviewList.find('.review');
            let stockFound = false;

            reviewItems.each(function() {
                const reviewItem = $(this);
                if (reviewItem.find('h3').text().includes(stockName)) {
                    reviewItem[0].scrollIntoView({ behavior: 'smooth' });
                    stockFound = true;
                    return false; // break the loop
                }
            });

            if (!stockFound) {
                saveToSearchHistory(stockName);
                alert('Review is being prepared. Please try again later.');
            }
        });

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
            <input type="text" id="stockName" name="stockName" value={stockName} onChange={(e) => setStockName(e.target.value)} />
            <button id="searchReviewButton">Search Review</button>
            <div id="reviewList"></div>
        </div>
    );
}

export default App;

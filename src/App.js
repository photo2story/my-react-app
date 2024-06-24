import React, { useState, useEffect } from 'react';
import $ from 'jquery';
import 'jquery-ui/ui/widgets/autocomplete';
import './App.css';

const App = () => {
  const [stockName, setStockName] = useState('');

  useEffect(() => {
    loadReviews();

    $('#stockName').autocomplete({
      source: (request, response) => {
        $.ajax({
          url: 'http://localhost:8080/api/get_tickers',
          method: 'GET',
          dataType: 'json',
          success: (data) => {
            const filteredData = data.filter(item =>
              item.Symbol.toUpperCase().includes(request.term.toUpperCase()) ||
              item.Name.toUpperCase().includes(request.term.toUpperCase())
            ).map(item => ({
              label: `${item.Symbol} - ${item.Name} - ${item.Market} - ${item.Sector} - ${item.Industry}`,
              value: item.Symbol
            }));
            response(filteredData);
          },
          error: () => {
            console.error('Error fetching tickers');
          }
        });
      },
      select: (event, ui) => {
        setStockName(ui.item.value);
        $('#searchReviewButton').click();
        return false;
      }
    });

    $('#stockName').on('input', function () {
      this.value = this.value.toUpperCase();
    });

    $('#stockName').on('keypress', function (e) {
      if (e.which === 13) {
        $('#searchReviewButton').click();
        return false;
      }
    });

    $('#searchReviewButton').click(() => {
      searchReview(stockName);
    });
  }, [stockName]);

  const loadReviews = () => {
    const reviewList = $('#reviewList');
    $.getJSON('https://api.github.com/repos/photo2story/my-react-app/contents/', (data) => {
      data.forEach(file => {
        if (file.name.startsWith('comparison_') && file.name.endsWith('.png')) {
          const stockName = file.name.replace('comparison_', '').replace('_VOO.png', '').toUpperCase();
          const newReview = $(`
            <div class="review">
              <h3>${stockName} vs VOO</h3>
              <img id="image-${stockName}" src="${file.download_url}" alt="${stockName} vs VOO" style="width: 100%;">
            </div>
          `);
          reviewList.append(newReview);
          $(`#image-${stockName}`).on('click', () => {
            showMplChart(stockName);
          });
        }
      });
    }).fail(() => {
      console.error('Error fetching the file list');
    });
  };

  const showMplChart = (stockName) => {
    const url = `https://raw.githubusercontent.com/photo2story/my-react-app/result_mpl_${stockName}.png`;
    window.open(url, '_blank');
  };

  const searchReview = (stockName) => {
    const reviewList = $('#reviewList');
    const reviewItems = reviewList.find('.review');
    let stockFound = false;

    reviewItems.each(function () {
      const reviewItem = $(this);
      if (reviewItem.find('h3').text().includes(stockName)) {
        reviewItem[0].scrollIntoView({ behavior: 'smooth' });
        stockFound = true;
        return false;
      }
    });

    if (!stockFound) {
      saveToSearchHistory(stockName);
      alert('Review is being prepared. Please try again later.');
    }
  };

  const saveToSearchHistory = (stockName) => {
    $.ajax({
      url: 'http://localhost:8080/save_search_history',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ stock_name: stockName }),
      success: (data) => {
        if (data.success) {
          console.log(`Saved ${stockName} to search history.`);
        } else {
          console.error('Failed to save to search history.');
        }
      },
      error: () => {
        console.error('Error saving to search history');
      }
    });
  };

  return (
    <div className="App">
      <h1>Stock Comparison Review</h1>
      <div>
        <label htmlFor="stockName">Stock name:</label>
        <input
          type="text"
          id="stockName"
          value={stockName}
          onChange={e => setStockName(e.target.value)}
        />
        <button id="searchReviewButton">Search Review</button>
      </div>
      <div id="reviewList"></div>
    </div>
  );
};

export default App;

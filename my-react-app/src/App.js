import React, { useEffect } from 'react';
import './App.css';
import $ from 'jquery';
import 'jquery-ui/ui/widgets/autocomplete';

const App = () => {
  const [stockName, setStockName] = useState('');

  useEffect(() => {
    $('#stockName').autocomplete({
      source: function (request, response) {
        $.ajax({
          url: 'http://localhost:3000/api/get_tickers',
          method: 'GET',
          dataType: 'json',
          success: function (data) {
            const filteredData = $.map(data, function (item) {
              if (item.Symbol.toUpperCase().includes(request.term.toUpperCase()) ||
                item.Name.toUpperCase().includes(request.term.toUpperCase())) {
                return {
                  label: `${item.Symbol} - ${item.Name} - ${item.Market} - ${item.Sector} - ${item.Industry}`,
                  value: item.Symbol
                };
              } else {
                return null;
              }
            });
            response(filteredData);
          },
          error: function () {
            console.error('Error fetching tickers');
          }
        });
      },
      select: function (event, ui) {
        setStockName(ui.item.value);
        $('#searchReviewButton').click();
        return false;
      }
    });

    $('#stockName').on('keypress', function (e) {
      if (e.which === 13) { // Enter key
        $('#searchReviewButton').click();
        return false;
      }
    });
  }, []);

  const handleSearch = () => {
    const reviewList = $('#reviewList');
    const reviewItems = reviewList.find('.review');
    let stockFound = false;

    reviewItems.each(function () {
      const reviewItem = $(this);
      if (reviewItem.find('h3').text().includes(stockName.toUpperCase())) {
        reviewItem[0].scrollIntoView({ behavior: 'smooth' });
        stockFound = true;
        return false; // break the loop
      }
    });

    if (!stockFound) {
      alert('Review is being prepared. Please try again later.');
    }
  };

  return (
    <div>
      <h1>Stock Comparison Review</h1>
      <label htmlFor="stockName">Stock name:</label>
      <input type="text" id="stockName" name="stockName" value={stockName} onChange={(e) => setStockName(e.target.value)} />
      <button id="searchReviewButton" onClick={handleSearch}>Search Review</button>
      <div id="reviewList">
        {/* 리뷰 목록이 여기 표시됩니다 */}
      </div>
    </div>
  );
};

export default App;
import React, { useState, useEffect } from 'react';
import $ from 'jquery';
import 'jquery-ui/ui/widgets/autocomplete';
import './App.css';

const App = () => {
  const [stockName, setStockName] = useState('');
  const [tickers, setTickers] = useState([]);
  const [filteredTickers, setFilteredTickers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReviews();
    loadTickers();
  }, []);

  useEffect(() => {
    filterTickers(stockName);
  }, [stockName, tickers]);

  const loadTickers = () => {
    $.ajax({
      url: 'http://localhost:8080/api/get_tickers',
      method: 'GET',
      dataType: 'json',
      success: (data) => {
        setTickers(data);
      },
      error: () => {
        console.error('Error fetching tickers');
      }
    });
  };

  const filterTickers = (input) => {
    const filtered = tickers.filter(ticker =>
      ticker.Symbol.toUpperCase().includes(input.toUpperCase()) ||
      ticker.Name.toUpperCase().includes(input.toUpperCase())
    );
    setFilteredTickers(filtered);
  };

  const loadReviews = () => {
    const reviewList = $('#reviewList');
    $.getJSON('https://api.github.com/repos/photo2story/my-react-app/contents/', (data) => {
      data.forEach(file => {
        if (file.name.startsWith('comparison_') && file.name.endsWith('.png')) {
          const stockName = file.name.replace('comparison_', '').replace('_VOO.png', '').toUpperCase();
          const newReview = $(`
            <div class="review" id="review-${stockName}">
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
    const url = `https://raw.githubusercontent.com/photo2story/my-react-app/main/result_mpl_${stockName}.png`;
    window.open(url, '_blank');
  };

  const searchReview = (stockName) => {
    setLoading(true);
    const reviewList = $('#reviewList');
    const reviewItems = reviewList.find('.review');
    const results = [];

    reviewItems.each(function () {
      const reviewItem = $(this);
      const reviewText = reviewItem.find('h3').text().split(' ')[0];
      if (reviewText === stockName) {
        results.push(reviewItem[0]);
      }
    });

    if (results.length > 0) {
      setSearchResults(results);
      setCurrentResultIndex(0);
      scrollToResult(0, results);
    } else {
      setSearchResults([]);
      alert('해당 주식 리뷰를 찾을 수 없습니다.');
    }
    setLoading(false);
  };

  const scrollToResult = (index, results) => {
    const reviewElement = results[index];
    if (reviewElement) {
      reviewElement.scrollIntoView({ behavior: 'smooth' });
      reviewElement.style.backgroundColor = 'yellow';  // Highlight the found review
    }
  };

  const handleNextResult = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentResultIndex + 1) % searchResults.length;
      setCurrentResultIndex(nextIndex);
      scrollToResult(nextIndex, searchResults);
    }
  };

  const handlePreviousResult = () => {
    if (searchResults.length > 0) {
      const prevIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
      setCurrentResultIndex(prevIndex);
      scrollToResult(prevIndex, searchResults);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchReview(stockName);
    }
  };

  return (
    <div className="App">
      <div className="fixed-header">
        <h1>Stock Comparison Review</h1>
        <div className="search-container">
          <label htmlFor="stockName">Stock name:</label>
          <input
            type="text"
            id="stockName"
            value={stockName}
            onChange={e => setStockName(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
          />
          <button id="searchReviewButton" onClick={() => searchReview(stockName)}>Search Review</button>
        </div>
        {loading && <div>Loading...</div>}
        {filteredTickers.length > 0 && (
          <select
            size={10}
            onChange={e => setStockName(e.target.value)}
          >
            {filteredTickers.map(ticker => (
              <option key={ticker.Symbol} value={ticker.Symbol}>
                {ticker.Symbol} - {ticker.Name}
              </option>
            ))}
          </select>
        )}
        {searchResults.length > 0 && (
          <div>
            <button onClick={handlePreviousResult}>Previous</button>
            <span>{`${currentResultIndex + 1}/${searchResults.length}`}</span>
            <button onClick={handleNextResult}>Next</button>
          </div>
        )}
      </div>
      <div id="reviewList" style={{ paddingTop: '150px' }}></div> {/* 추가된 패딩 */}
    </div>
  );
};

export default App;

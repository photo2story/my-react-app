import React, { useState, useEffect } from 'react';
import $ from 'jquery';
import 'jquery-ui/ui/widgets/autocomplete';
import './App.css';

const App = () => {
  const [stockName, setStockName] = useState('');
  const [stockFound, setStockFound] = useState(true);

  useEffect(() => {
    loadReviews();

    $('#stockName').autocomplete({
      source: (request, response) => {
        $.ajax({
          url: 'http://localhost:5000/api/get_tickers',
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
        searchReview(ui.item.value);
        return false;
      }
    });

    $('#stockName').on('input', function () {
      this.value = this.value.toUpperCase();
      setStockName(this.value);
    });

    $('#stockName').on('keypress', function (e) {
      if (e.which === 13) {
        searchReview(this.value);
        return false;
      }
    });

    $('#searchReviewButton').click(() => {
      searchReview(stockName);
    });
  }, []);

  const loadReviews = () => {
    const reviewList = $('#reviewList');
    reviewList.empty(); // 기존 리뷰 요소 제거
    const exampleData = [
      { name: 'TSLA', url: 'https://photo2story.github.io/my-react-app/comparison_tsla_VOO.png' },
      { name: 'AAPL', url: 'https://photo2story.github.io/my-react-app/comparison_aapl_VOO.png' },
    ];

    exampleData.forEach(file => {
      const stockName = file.name;
      const newReview = $(`
        <div class="review" id="review-${stockName}">
          <h3>${stockName} vs VOO</h3>
          <img id="image-${stockName}" src="${file.url}" alt="${stockName} vs VOO" style="width: 100%;" />
        </div>
      `);
      reviewList.append(newReview);
      $(`#image-${stockName}`).on('click', () => {
        showMplChart(stockName);
        console.log(`ID: review-${stockName}, Stock Name: ${stockName}`);
      });
    });
  };

  const showMplChart = (stockName) => {
    const url = `https://photo2story.github.io/my-react-app/result_mpl_${stockName}.png`;
    window.open(url, '_blank');
  };

  const searchReview = (stockName) => {
    console.log(`Searching for: ${stockName}`);
    const reviewList = $('#reviewList');
    const reviewItems = reviewList.find('.review');
    let stockFound = false;

    // ID를 기반으로 찾기
    const reviewElement = document.getElementById(`review-${stockName}`);
    console.log(`Review element for ${stockName}:`, reviewElement); // 디버그용 로그

    if (reviewElement) {
      console.log(`Scrolling to: review-${stockName}`); // 디버그용 로그
      reviewElement.scrollIntoView({ behavior: 'smooth' });
      alert(`${stockName}로 이동합니다.`);
      stockFound = true;
    } else {
      // 텍스트를 기반으로 찾기
      reviewItems.each(function () {
        const reviewItem = $(this);
        if (reviewItem.find('h3').text().includes(stockName.toUpperCase())) {
          console.log(`Scrolling to element with text: ${stockName}`); // 디버그용 로그
          reviewItem[0].scrollIntoView({ behavior: 'smooth' });
          alert(`${stockName}로 이동합니다.`);
          stockFound = true;
          return false; // 루프 종료
        }
      });
    }

    setStockFound(stockFound);

    if (!stockFound) {
      alert(`${stockName} 리뷰를 찾을 수 없습니다. 준비 중입니다.`);
    }
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
      {!stockFound && <div style={{ color: 'red' }}>해당 주식 리뷰를 찾을 수 없습니다.</div>}
      <div id="reviewList"></div>
    </div>
  );
};

export default App;

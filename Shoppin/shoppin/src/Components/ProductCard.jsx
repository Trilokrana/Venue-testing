import React, { useState, useEffect } from "react";
import { products } from "../data/ProductData";

const ProductCard = () => {
  const [cards, setCards] = useState(products);
  const [activeButton, setActiveButton] = useState(null);
  const animationDuration = 300; 


  useEffect(() => {
    if (!products || products.length === 0) {
      console.error("No products data found or products array is empty");
    }


    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1, maximum-scale=1";
    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(meta);
    };
  }, []);
  
  const completeSwipe = (direction, cardId) => {
    if (direction === "right") {
      console.log(`Liked Product ID: ${cardId}`);

    } else if (direction === "left") {
      console.log(`Passed Product ID: ${cardId}`);
    } else if (direction === "up") {
      console.log(`Add to cart Product ID: ${cardId}`);
    
    }

    setCards((prevCards) => prevCards.slice(1));
    setActiveButton(null);
  };

  const swipeLeft = () => {
    if (cards.length === 0) return;
    const cardId = cards[0].id;
    const topCard = document.querySelector(".card.z-10");

    if (topCard) {
      topCard.style.transform = `translateX(-100vw) rotate(-30deg)`;
      setTimeout(() => {
        completeSwipe("left", cardId);
      }, animationDuration);
      setActiveButton("left"); 
    }
  };

  const swipeRight = () => {
    if (cards.length === 0) return;
    const cardId = cards[0].id;
    const topCard = document.querySelector(".card.z-10");

    if (topCard) {
      topCard.style.transform = `translateX(100vw) rotate(30deg)`;
      setTimeout(() => {
        completeSwipe("right", cardId);
      }, animationDuration);
      setActiveButton("right"); 
    }
  };

  const swipeUp = () => {
    if (cards.length === 0) return;
    const cardId = cards[0].id;
    const topCard = document.querySelector(".card.z-10");

    if (topCard) {
      topCard.style.transform = `translateY(-100vh)`;
      setTimeout(() => {
        completeSwipe("up", cardId);
      }, animationDuration);
      setActiveButton("up"); 
    }
  };

  
  const handleDrag = (e, cardId) => {
    if (!e.touches || e.touches.length === 0) return;

    const card = e.target.closest(".card");
    if (!card) return;

    const startX = parseFloat(card.dataset.startX || 0);
    const startY = parseFloat(card.dataset.startY || 0);
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX;
    const deltaY = startY - currentY; 

    if (Math.abs(deltaX) > Math.abs(deltaY) || Math.abs(deltaY) < 20) {
  
      card.style.transform = `translateX(${deltaX}px) rotate(${
        deltaX / 20
      }deg)`;
    } else {
  
      card.style.transform = `translateY(${-deltaY}px)`; 
    }
  };

  const handleDragStart = (e, cardId) => {
    if (!e.touches || e.touches.length === 0) return;
    const card = e.target.closest(".card");
    if (card) {
      card.dataset.startX = e.touches[0].clientX;
      card.dataset.startY = e.touches[0].clientY;
      card.style.transition = "transform 0s";
    }
  };


  const handleDragEnd = (e, cardId) => {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const card = e.target.closest(".card");
    if (!card) return;


    card.style.transition = `transform ${animationDuration}ms ease-out`;

    const startX = parseFloat(card.dataset.startX || 0);
    const startY = parseFloat(card.dataset.startY || 0);
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - startX;
    const deltaY = startY - endY; 

    const threshold = 100; 

    let swiped = false;
    let direction = null;

  
    if (deltaX > threshold) {
      direction = "right";
      swiped = true;
      card.style.transform = `translateX(100vw) rotate(30deg)`; 
    } else if (deltaX < -threshold) {
      direction = "left";
      swiped = true;
      card.style.transform = `translateX(-100vw) rotate(-30deg)`; 
    } else if (deltaY > threshold) {
    
      direction = "up";
      swiped = true;
      card.style.transform = `translateY(-100vh)`; 
    }
  


    if (swiped && direction) {
      setTimeout(() => {
        completeSwipe(direction, cardId);
      }, animationDuration);
    } else {
    
      card.style.transform = "translateX(0) translateY(0) rotate(0)";
    }

    delete card.dataset.startX;
    delete card.dataset.startY;
  };


  return (
    <main className="bg-gray-100 h-screen flex flex-col overflow-hidden">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <div className="text-3xl font-bold text-pink-500">Shoppin</div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div className="relative w-full max-w-sm h-[76vh]">
         

          {cards && cards.length > 0 ? (
            [...cards].reverse().map((card, index, reversedArray) => {
              const originalIndex = reversedArray.length - 1 - index;
              const isTopCard = originalIndex === 0;

              return (
                <div
                  key={card.id}
                  className={`card absolute w-full h-full bg-white rounded-xl shadow-xl transition-all duration-${animationDuration} ease-out ${
                    isTopCard
                      ? "z-10 scale-100" 
                      : originalIndex === 1
                      ? "z-0 scale-[0.95] translate-y-4 opacity-80" 
                      : originalIndex === 2
                      ? "z-0 scale-[0.9] translate-y-8 opacity-60" 
                      : "z-0 scale-[0.9] translate-y-8 opacity-0" 
                  }`}
    
                  onTouchStart={
                    isTopCard ? (e) => handleDragStart(e, card.id) : undefined
                  }
                  onTouchMove={
                    isTopCard ? (e) => handleDrag(e, card.id) : undefined
                  }
                  onTouchEnd={
                    isTopCard ? (e) => handleDragEnd(e, card.id) : undefined
                  }
                 
                  style={{ pointerEvents: isTopCard ? "auto" : "none" }}
                >
                  <div className="relative w-full h-3/4 overflow-hidden rounded-t-xl">
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black opacity-30"></div>
                  </div>

                  <div
                    className="p-4 overflow-y-auto"
                    style={{ maxHeight: "40%" }} 
                  >
                    <div>
                      <h2 className="text-2xl font-bold flex-1">{card.name}</h2>
                    </div>
                    <h3 className="text-lg font-bold italic text-indigo-600">
                      {card.brand}
                    </h3>

                    <div className="flex items-center justify-between">
                      <div>
                        {card.originalPrice && (
                          <p className="text-gray-500 line-through text-lg">
                            ${card.originalPrice}
                          </p>
                        )}
                        <p className="text-2xl font-semibold text-pink-600">
                          ${card.price}
                        </p>
                      </div>
                      {card.discountPercentage && (
                        <span className="bg-red-500 text-white px-3 py-1 font-bold rounded-xl text-sm flex-shrink-0">
                          {card.discountPercentage}% off
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-xl">No more products!</p>
            </div>
          )}
        </div>
      </div>

      {cards && cards.length > 0 && (
        <div className="flex justify-center items-center p-4 pb-8">
          <div className="flex space-x-8">
            <button
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border border-gray-200 transition-colors duration-300 ${
                activeButton === "left" ? "bg-red-500" : "bg-white"
              }`}
              onClick={swipeLeft} 
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-8 w-8 transition-colors duration-300 ${
                  activeButton === "left" ? "text-white" : "text-red-500"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <button
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border border-gray-200 transition-colors duration-300 ${
                activeButton === "up" ? "bg-blue-500" : "bg-white"
              }`}
              onClick={swipeUp} 
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-8 w-8 transition-colors duration-300 ${
                  activeButton === "up" ? "text-white" : "text-blue-500"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </button>

            <button
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border border-gray-200 transition-colors duration-300 ${
                activeButton === "right" ? "bg-green-500" : "bg-white"
              }`}
              onClick={swipeRight} 
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-8 w-8 transition-colors duration-300 ${
                  activeButton === "right" ? "text-white" : "text-green-500"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProductCard;

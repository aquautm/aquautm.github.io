const swiper = new Swiper(".mySwiper", {
    loop: true,
    slidesPerView: 1,          // only 1 slide fully visible
    centeredSlides: false,     
    spaceBetween: 0,           
    autoplay: { 
        delay: 3000, 
        disableOnInteraction: false 
    },
    navigation: { 
        nextEl: ".swiper-button-next", 
        prevEl: ".swiper-button-prev" 
    },
    pagination: { 
        el: ".swiper-pagination", 
        clickable: true 
    },
    autoHeight: false
});

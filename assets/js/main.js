let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

menuIcon.onclick = () => {
  menuIcon.classList.toggle('bx-x');
  navbar.classList.toggle('active');
};




let sections = document.querySelectorAll('section');
let navLinks =document.querySelectorAll('header nav a');
window.onscroll = () => {
     sections.forEach(sec => {
         let top = window.scrollY;
         let offset = sec.offsetTop - 150;
         let height = sec.offsetHeight;
         let id = sec.getAttribute('id');
         if(top >= offset && top < offset + height) {
             navLinks.forEach(links => {
                 links.classList.remove('active');
                 document.querySelector('header nav a[href*=' + id + ']' ).classList.add('active');
             });
         };
     });

     let header = document.querySelector('header');
    header.classList.toggle('sticky',window.scrollY > 100);
};


menuIcon.classList.remove('bx-x');
navbar.classList.remove('active');





/*==================== SHOW SCROLL UP ====================*/ 
ScrollReveal({
    reset:true,
    distance: '80px',
    duration: 2000,
    delay: 200
});

ScrollReveal().reveal('.home-content, .heading', {origin:'top'});
ScrollReveal().reveal('.home-img, .services-container, .portfolio-box, .contact form, .skills-box', {origin:'buttom'});
ScrollReveal().reveal('.home-content h1, .about-img', {origin:'left'});
ScrollReveal().reveal('.home-content p, .about-content', {origin:'right'});



/*==================== Email ====================*/
function sendMail()
{
    var params = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        subject: document.getElementById("Subject").value,
        message: document.getElementById("Message").value
    };
}

const serviceId = "service_oyusurb";
const templateId = "template_1k8tgrn";

emailjs.send(serviceId,templateId,params).then(
    res => {
        document.getElementById("name").value = "";
        document.getElementById("email").value ="";
        document.getElementById("phone").value="" ;
        document.getElementById("Subject").value ="";
        document.getElementById("Message").value ="";
        const myToast = new bootstrap.Toast(document.getElementById("toast"));
        myToast.show();
      },
      error => {
        console.log("Failed to send email:", error);
      }
);
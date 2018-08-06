import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(e) {
  e.preventDefault();
  // console.log('hearted');
  // console.log(this);   // here this is the form tag
  axios
    .post(this.action)
    .then(res => {
      // console.log(res.data);
      const isHearted = this.heart.classList.toggle('heart__button--hearted');
      // this is the form tag and we can access everything inside by its name, like here this.heart
      // console.log(isHearted)
      $('.heart-count').textContent = res.data.hearts.length;
      if(isHearted) {
        this.heart.classList.add('heart__button--float');
        setTimeout(() => this.heart.classList.remove('heart__button--float'), 2500);
      }
    })
    .catch(console.error);
}

export default ajaxHeart;

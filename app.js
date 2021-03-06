/*
Copyright (c) 2018 Johannes Christian Gosch
Permission is hereby granted, free of charge,
to any person obtaining a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

const baseUrl = "http://icebox.nobreakspace.org:8081/";    
const eventHub = new Vue();

//Eventually you want to use VueX instead of this rudiment source of truth
const state = {
    drinks:[],
    consumers: [],
    selectedUser: null,
    selectedDrink: null,

    findDrinkByBarcode (barcode){
        return this.drinks.find(drink => drink.barcode === barcode);
    }
}
//Eventually you want to use VueX instead of a global eventHub...
Vue.mixin({
    data: function () {
        return {
            eventHub: eventHub,

        }

    },
})

const Overview = {
    template: '#overview-template',
    data:()=>({
        showConsumers: true
    }),
    inherit: true,
    mounted(){
        this.eventHub.$on('user-selected',data => {
            this.showConsumers = false;
        });

        this.eventHub.$on('user-deselected',data => {
            this.showConsumers = true;
        });
    
    },
}
Vue.component('overview', Overview);

const Keyboard = {
    template: '#keyboard-template',
    data: () =>({
        input: '',
        letters: ['A','B','C','D','E','F','G','H','I','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
    }),
    inherit: true,
    methods:{
        pressed(event){
            this.input += event.target.firstChild.data.toLowerCase();
        },
        changed(){
            this.eventHub.$emit('update',this.input);
        },
        deleteInput(){
            this.input = '';
            this.eventHub.$emit('update',this.input);
        }
    },
    mounted(){
        this.eventHub.$on('bought', data => {
            this.input = '';
        });
    }
}
Vue.component('keyboard', Keyboard);

const Drinks =  {
    template: '#drinks-template',
    data: () => ({
        state: state
    
    }),
    mounted() {
        this.getDrinks();
    },
    inherit: true,
    methods: {
        getDrinks() {
            axios.get(baseUrl + `drinks`).then(response => {
                this.state.drinks = response.data
                this.state.drinks.map(drink => drink.image = 'img/'+drink.barcode+'.png');
                this.state.drinks = this.state.drinks.filter(function(drink){
                    if(drink.quantity > 0){
                        return drink; 
                    }
                });
                console.log(this.state.drinks);
            }).catch(error => {
                console.log(error);
            })
        },        
        selectDrink(event){
            console.log(event);
            this.eventHub.$emit('drink-selected', event.target.value);
            
        }
    },
};
Vue.component('drinks', Drinks);

const Revert_order = {    
    template: '#revert-order-template',
    inherit: true,
    data: () => ({
        state:state,
        collapse: true,
        dismissSecs: 10,
        dismissCountDown: 0,
    }),
    mounted(){
        this.eventHub.$on('user-selected', user => {
            console.log(user);
            this.state.selectedUser = user;
        });
        this.eventHub.$on('drink-selected', drink => {
            this.state.selectedDrink = drink;
        });          
    },
    methods:{
        deselectUser(){
            this.state.selectedUser = null;
            console.log('user deselected');
            this.eventHub.$emit('user-deselected');
        },
        deselectDrink(){
            this.state.selectedDrink = null;
            console.log('drink deselected');
        },
        countDownChanged (dismissCountDown) {
            this.dismissCountDown = dismissCountDown
          },
        showAlert () {
            this.dismissCountDown = this.dismissSecs
        },
        buy(drink,consumer){
            this.showAlert();
            this.eventHub.$emit('bought');
            this.deselectDrink();
            this.deselectUser();
        }
    },
    computed:{
        collapsed(){
            if(this.state.selectedDrink === null && this.state.selectedUser === null){
                this.collapse = false;
                return false;
            }else{
                this.collapse = true;
                return true;
            }
        },
        selectedDrinkName(){
            if(this.state.selectedDrink !== null && this.state.selectedDrink !== undefined){
                return this.state.findDrinkByBarcode(this.state.selectedDrink).name;
            }else{
                return '';
            }
        }
    }
}
Vue.component('revert-order', Revert_order); 

const Consumers = {
    template: '#consumers-template',
    data: () => ({
        state: state,
        filterString: '',
    }),
    computed:{
        filteredConsumers(){
            function startsWith(wordToCompare) {
                return function(string) {
                    return string.username.toLowerCase().indexOf(wordToCompare) === 0;
                }
            }
            console.log(this.filterString);
            return this.state.consumers.filter(
                startsWith(this.filterString)
            );
        }
    },
    mounted(){
        this.getConsumers();
        this.eventHub.$on('update', data => {
                this.filterString = data;
            });
    },
    inherit: true,
    methods: {
        getConsumers(){
            axios.get(baseUrl + `consumers`).then(response => {
                this.state.consumers = response.data
            }).catch(error => {
                console.log(error);
            })
        },
        selectConsumer(event){
            this.eventHub.$emit('user-selected', event.target.value);
            
        }
    }
};
Vue.component('consumers', Consumers);

const Inventur = {
    template: '#inventur-template',

}
Vue.component('inventur', Inventur);

const router = new VueRouter({
    routes: [
        {
            path: '/',
            name: 'overview',
            components: {
                main: Overview,
                navbar: Revert_order
            },
        },
        {
            path: '/inventur',
            name: 'inventur',
                components:{
                    main: Inventur
                }
        }
    ]
  })
  

const vue = new Vue({
    router
});
var app = vue.$mount('#app');
import Vue from 'vue'
import i18n from '../libs/i18n'

import myluBucket from '../models/myluBucket'
import Config from '../models/Config'
import openSimpleModal from '../libs/simple-modal'

Vue.filter('i18n',i18n)

new Vue({
  el:'#init',

  data:{
    ak:'',
    sk:'',
    password:'',
    title:'',
    subtitle:'',
    background:'url',
    background_url:''
  },

  ready() {
    Config.load(true)
      .then(config => {
        if(!config) return
        const url = `${location.protocol}//${location.host}`

        openSimpleModal(
          'Warning',
          'This web is already inited. I love you, my lulu.',
          `<a href="${url}" class="btn btn-primary" role="button">OK</a>`
        )

        this.$el.remove()
      })
  },

  methods:{
    reset() {
      this.ak = ''
      this.sk = ''
      this.password = ''
      this.title = ''
      this.subtitle = ''
      this.background = 'url'
      this.background_url = ''
    },

    submit(evt) {
      new Button(evt.target,'loading')
      const ak = this.ak
      const sk = this.sk

      myluBucket.fetchPutToken(this.password,null,{ak,sk})
        .then(putToken => {
          const fileData = new Blob([JSON.stringify({ak,sk})],{type:'application/json'})
          fileData.name = `secret-${this.password}.json`

          return myluBucket
            .putFile(
              fileData.name,
              fileData,
              {putToken}
            )
            .then(() => putToken)
        })
        .then(putToken => {
          switch(this.background) {
            case 'url':
              return this.background_url
              break
            case 'file':
              const file = this.$els.backgroundfile.files[0]
              if(!file) {
                throw new Error('Please select a file.')
              }

              const key = `assets/bg-${Math.random().toString(32).substr(2)}`
              return myluBucket.putFile(key,file,{putToken})
                .then(() => {
                  const asset = myluBucket.key(key)
                  return asset.url()
                })
          }
        })
        .then(backgroundUrl => {
          const config = {
            title:this.title,
            description:this.subtitle,
            background:backgroundUrl
          }

          return Config.update(this.password,config,true)
        })
        .then(() => {
          const url = `${location.protocol}//${location.host}`
          const adminUrl = url + '/admin'

          openSimpleModal(
            'Congratulation!',
            'Your website is ready for use.',
            `
              <a href="${url}" class="btn btn-primary" role="button">Go to mylu</a>
              <a href="${adminUrl}" class="btn" role="button">Go to admin tools</a>
            `
          )
        })
        .catch(err => {
          new Button(evt.target,'reset')

          openSimpleModal(
            'Error',
            err.message,
            `<button class="btn btn-primary" role="button">OK</button>`
          )
        })
    }
  }
})

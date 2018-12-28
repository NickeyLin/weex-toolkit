import { Component, Vue } from 'vue-property-decorator'
import { State, Action, namespace } from 'vuex-class'
import SockJS from 'simple-websocket'
import QrcodeVue from 'qrcode.vue'
import './home.scss'

const Module = namespace('home')

@Component({
  template: require('./home.html'),
  components: {
    qrcode: QrcodeVue,
  },
  filters: {
    sliceFilename(value: any) {
      let array = value.split('/')
      let len: number = array.length
      if (len > 2) {
        return `${array[len - 2]}/${array[len - 1]}`
      }
      return value
    },
  },
})
export class HomeComponent extends Vue {
  entry: string = ''
  pages: string[] = []
  qrcodeUrl: string = ''
  previewUrl: string = ''
  port: number | string
  socket: any = null
  preview: string = ''
  created() {
    this.init(this.$route.query)
  }

  mounted() {
    if (this.entry) {
      this.previewUrl = this.generatePreviewUrl(this.entry)
      this.qrcodeUrl = this.generateQRCodeUrl(this.port, this.transformEntry(this.entry))
    }
    if (this.port) {
      this.connectHotreloadServer(this.port)
    }
  }

  init(query: any) {
    if (query.entry) {
      this.entry = query.entry
    }
    if (query.pages) {
      try {
        this.pages = JSON.parse(decodeURI(query.pages))
      } catch (e) {
        console.error(e)
        this.pages = []
      }
    }
    if (query.wsport) {
      this.port = query.wsport
    }
    if (query.preview) {
      this.preview = query.preview
    }
  }

  connectHotreloadServer(port: number | string) {
    this.socket = new SockJS(`ws://${window.location.hostname}:${port}`)
    // this.socket = new SockJS(`ws://localhost:8080/sockjs-node/768/vz1v51sz/websocket`)
    this.socket.on('connect', data => {
      this.$snotify.success('HotReload Conneted')
    })
    this.socket.on('data', data => {
      this.$snotify.success('Updated')
      let reloadPreview = this.previewUrl
      this.previewUrl = ''
      this.$nextTick(() => {
        this.previewUrl = reloadPreview
      })
    })
    this.socket.on('close', data => {
      this.$snotify.error('HotReload Disconneted')
    })
    this.socket.on('error', data => {
      console.error(data)
    })
  }

  transformEntry(entry) {
    return `http://${window.location.host}/dist/${entry}`
  }

  generatePreviewUrl(entry) {
    if (this.preview === 'single') {
      return `/assets/weex/weex.html?page=${entry.replace('.js', '.web.js')}`
    } else {
      return `/assets/weex/index.html?page=${entry.replace('.js', '.web.js')}`
    }
  }

  generateQRCodeUrl(port: number | string, url: string) {
    return `${url}?wsport=${port}&_wx_tpl=${url}`
  }

  togglePage(entry: string) {
    this.entry = entry
    this.previewUrl = this.generatePreviewUrl(entry)
    this.qrcodeUrl = this.generateQRCodeUrl(this.port, this.transformEntry(entry))
  }
}

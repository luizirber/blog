'use strict'

const Sourmash = require('sourmash/sourmash.js')

var FileReadStream = require('filestream/read')
var FASTQStream = require('fastqstream').FASTQStream
var Fasta = require('fasta-parser')

var zlib = require('zlib')
var peek = require('peek-stream')
const through = require('through2')
const pumpify = require('pumpify')

const $dragContainer = document.querySelector('#drag-container')
const $progressBar = document.querySelector('#progress-bar')
const $downloadButton = document.querySelector('#download_btn')

const $ksizeInput = document.querySelector('#ksize-input')
const $scaledInput = document.querySelector('#scaled-input')
const $numInput = document.querySelector('#num-input')
const $proteinInput = document.querySelector('#protein-input')
const $trackAbundanceInput = document.querySelector('#track-abundance-input')

let fileSize = 0
let fileName
let loadedFile = 0

/* ===========================================================================
   Files handling
   =========================================================================== */

const resetProgress = () => {
  $downloadButton.disabled = true
  $progressBar.style.transform = 'translateX(-100%)'
}

/* Drag & Drop
   =========================================================================== */

const onDragEnter = () => $dragContainer.classList.add('dragging')

const onDragLeave = () => $dragContainer.classList.remove('dragging')

function isFASTA (data) {
  return data.toString().charAt(0) === '>'
}

function isFASTQ (data) {
  return data.toString().charAt(0) === '@'
}

function isGzip (data) {
  return (data[0] === 31) && (data[1] === 139)
}

function GzipParser () {
  return peek(function (data, swap) {
    if (isGzip(data)) return swap(null, new zlib.Unzip())
    else return swap(null, through())
  })
}

function FASTParser () {
  return peek(function (data, swap) {
    if (isFASTA(data)) return swap(null, pumpify.obj(Fasta(), jsParse()))
    if (isFASTQ(data)) return swap(null, new FASTQStream())

    // we do not know - bail
    swap(new Error('No parser available'))
  })
}

function onDrop (event) {
  onDragLeave()
  event.preventDefault()
  resetProgress()

  const dt = event.dataTransfer
  const filesDropped = dt.files

  var file = filesDropped[0]

  var reader = new FileReadStream(file)

  fileSize = file.size
  fileName = file.name

  reader.reader.onprogress = (data) => {
    loadedFile += data.loaded
    let percent = 100 - ((loadedFile / fileSize) * 100)

    $progressBar.style.transform = `translateX(${-percent}%)`
  }

  var num = $numInput.value
  var ksize = $ksizeInput.value
  var isProtein = $proteinInput.checked
  var scaled = $scaledInput.value
  var trackAbundance = $trackAbundanceInput.checked

  var mh = new Sourmash.KmerMinHash(num, ksize, isProtein, 42, scaled, trackAbundance)

  var seqparser = new FASTParser()
  var compressedparser = new GzipParser()

  seqparser
    .on('data', function (data) {
      mh.add_sequence_js(data.seq)
    })
    .on('end', function (data) {
      const jsonData = mh.to_json()
      const file = new window.Blob([jsonData], { type: 'application/octet-binary' })
      const url = window.URL.createObjectURL(file)

      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', fileName + '.sig')

      document.querySelectorAll('#download_btn a').forEach(e => e.parentNode.removeChild(e))

      $downloadButton.appendChild(link)
      $downloadButton.addEventListener('click', () => { link.click() })
      $downloadButton.disabled = false

      $progressBar.style.transform = `translateX(0%)`
    })

  switch (file.type) {
    case 'application/gzip':
      reader.pipe(new zlib.Unzip()).pipe(seqparser)
      break
    default:
      reader.pipe(compressedparser).pipe(seqparser)
      break
  }
}

function jsParse () {
  var stream = through.obj(transform, flush)
  return stream
  function transform (obj, enc, next) {
    if (Buffer.isBuffer(obj)) { obj = obj.toString() }
    JSON.parse(obj)
    this.push(JSON.parse(obj))
    next()
  }
  function flush () { this.push(null) }
}

/* ===========================================================================
   Boot the app
   =========================================================================== */

const startApplication = () => {
  // Setup event listeners
  $dragContainer.addEventListener('dragenter', onDragEnter)
  $dragContainer.addEventListener('dragover', onDragEnter)
  $dragContainer.addEventListener('drop', onDrop)
  $dragContainer.addEventListener('dragleave', onDragLeave)
}

startApplication()

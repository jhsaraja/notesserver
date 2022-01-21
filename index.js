/*
Heti alussa otetaan käyttöön express, joka on tällä kertaa funktio, 
jota kutsumalla luodaan muuttujaan app sijoitettava Express-sovellusta vastaava olio:
*/
const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json()) // Otetaan json-parseri käyttöön

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}
app.use(requestLogger)

let notes = [  
    {    
        id: 1,    
        content: "HTML is easy",    
        date: "2020-01-10T17:30:31.098Z",    
        important: true  
    },  
    {    
        id: 2,    
        content: "Browser can execute only Javascript",    
        date: "2020-01-10T18:39:34.091Z",    
        important: false  
    },  
    {    
        id: 3,    
        content: "GET and POST are the most important methods of HTTP protocol",    
        date: "2020-01-10T19:20:14.298Z",    
        important: true  
    }
]

/*
Seuraavaksi määritellään sovellukselle kaksi routea. Näistä ensimmäinen määrittelee 
tapahtumankäsittelijän, joka hoitaa sovelluksen juureen eli polkuun / tulevia HTTP GET -pyyntöjä.

Tapahtumankäsittelijäfunktiolla on kaksi parametria. Näistä ensimmäinen eli request sisältää 
kaikki HTTP-pyynnön tiedot ja toisen parametrin response:n avulla määritellään, miten pyyntöön vastataan.

Koodissa pyyntöön vastataan käyttäen response-olion metodia send, jonka kutsumisen seurauksena 
palvelin vastaa HTTP-pyyntöön lähettämällä selaimelle vastaukseksi send:in parametrina olevan 
merkkijonon <h1>Hello World!</h1>. Koska parametri on merkkijono, asettaa Express vastauksessa 
Content-Type-headerin arvoksi text/html. Statuskoodiksi tulee oletusarvoisesti 200. 
*/
app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
})

/*
Routeista toinen määrittelee tapahtumankäsittelijän, joka hoitaa sovelluksen polkuun /api/notes tulevia HTTP GET -pyyntöjä:

Pyyntöön vastataan response-olion metodilla json, joka lähettää HTTP-pyynnön vastaukseksi parametrina olevaa 
JavaScript-olioa eli taulukkoa notes vastaavan JSON-muotoisen merkkijonon. Express asettaa headerin Content-Type arvoksi application/json.

express-kirjastoa käytettäessä muunnos taulujosta JSON-muotoiseen dataan tehdään automaattisesti.
*/
app.get('/api/notes', (req, res) => {
  res.json(notes)
})

/*
Voimme määritellä Expressin routejen poluille parametreja käyttämällä kaksoispistesyntaksia:

Nyt app.get('/api/notes/:id', ...) käsittelee kaikki HTTP GET -pyynnöt, jotka ovat muotoa /api/notes/JOTAIN, jossa JOTAIN on mielivaltainen merkkijono.

Huomaa, että lokitukset tulevat nyt konsoliin (eli siihen terminaaliin, johon sovellus on käynnistetty).
*/
app.get('/api/notes/:id', (request, response) => {
  const id = Number(request.params.id) // muunnetaan numeroksi, koska muistiinpanon id on numerona
  console.log(id)
  const note = notes.find(note => note.id === id)

  // yllä olevalle pidempi muoto, jos halutaan esim. tulostusta mukaan
  /*const note = notes.find(note => {
    console.log(note.id, typeof note.id, id, typeof id, note.id === id)
    return note.id === id
  }) */

  console.log(note)
  if (note) {    
    response.json(note)  
  } else {    
    response.status(404).end()  // Koska vastaukseen ei nyt liity mitään dataa, käytetään statuskoodin asettavan metodin status lisäksi metodia end ilmoittamaan siitä, että pyyntöön tulee vastata ilman dataa.
  }
})

/*
Jos poisto onnistuu eli poistettava muistiinpano on olemassa, vastataan statuskoodilla 204 no content sillä mukaan ei lähetetä mitään dataa.

Ei ole täyttä yksimielisyyttä siitä, mikä statuskoodi DELETE-pyynnöstä pitäisi palauttaa jos poistettavaa resurssia ei ole olemassa. 
Vaihtoehtoja ovat lähinnä 204 ja 404. Yksinkertaisuuden vuoksi sovellus palauttaa nyt molemmissa tilanteissa statuskoodin 204.
*/
app.delete('/api/notes/:id', (request, response) => {
  const id = Number(request.params.id)
  notes = notes.filter(note => note.id !== id)

  response.status(204).end()
})

/*
Toteutetaan seuraavana uusien muistiinpanojen lisäys, joka siis tapahtuu tekemällä HTTP POST -pyyntö 
osoitteeseen http://localhost:3001/api/notes ja liittämällä pyynnön bodyyn luotavan muistiinpanon tiedot JSON-muodossa.

Jotta pääsisimme pyynnön mukana lähetettyyn dataan helposti käsiksi, tarvitsemme Expressin tarjoaman json-parserin apua. 
Tämä tapahtuu lisäämällä koodiin komento app.use(express.json()).

Ilman json-parserin lisäämistä eli komentoa app.use(express.json()) pyynnön kentän body arvo olisi ollut 
määrittelemätön. Json-parserin toimintaperiaatteena on, että se ottaa pyynnön mukana olevan JSON-muotoisen datan, 
muuttaa sen JavaScript-olioksi ja sijoittaa request-olion kenttään body ennen kuin routen käsittelijää kutsutaan.

Uudelle muistiinpanolle tarvitaan uniikki id. Ensin selvitetään olemassa olevista id:istä suurin muuttujaan maxId. 
Uuden muistiinpanon id:ksi asetetaan sitten maxId + 1. Tämä tapa ei ole kovin hyvä, mutta emme nyt välitä siitä, 
sillä tulemme pian korvaamaan tavan, jolla muistiinpanot talletetaan.
*/
/*app.post('/api/notes', (request, response) => {
  const maxId = notes.length > 0
    ? Math.max(...notes.map(n => n.id)) 
    : 0

  const note = request.body   // Tapahtumankäsittelijäfunktio pääsee dataan käsiksi olion request kentän body avulla.
  note.id = maxId + 1

  notes = notes.concat(note)

  response.json(note)
}) */
const generateId = () => {
  /*
  Mitä rivillä tapahtuu? notes.map(n => n.id) muodostaa taulukon, joka koostuu muistiinpanojen id-kentistä. 
  Math.max palauttaa maksimin sille parametrina annetuista luvuista. notes.map(n => n.id) on kuitenkin taulukko, 
  joten se ei kelpaa parametriksi komennolle Math.max. Taulukko voidaan muuttaa yksittäisiksi luvuiksi käyttäen 
  taulukon spread-syntaksia, eli kolmea pistettä ...taulukko.
  */
  const maxId = notes.length > 0
    ? Math.max(...notes.map(n => n.id))
    : 0
  return maxId + 1
}

app.post('/api/notes', (request, response) => {
  const body = request.body

  if (!body.content) {
    return response.status(400).json({ 
      error: 'content missing' 
    })
  }

  const note = {
    content: body.content,
    important: body.important || false,
    date: new Date(),
    id: generateId(),
  }

  notes = notes.concat(note)

  response.json(note)
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

//const PORT = 3001
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
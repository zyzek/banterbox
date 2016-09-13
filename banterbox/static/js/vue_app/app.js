var units = [
    {
        "public_id": "f595ffc2-a946-4aa3-ae51-61ad83cbef28",
        "lecturer": {"email": "jeffery79@hebert.com", "name": "Alexandria Marshall"},
        "created_at": 1472731865.293062,
        "room_name": "Freeman Cape",
        "name": "Automated executive Local Area Network",
        "code" : "AUTO3300",
        "icon": "anchor",
        "status": "open",
        "next_session": {"day": "MONDAY", "time": "14:00"},
    },
    {
        "public_id": "d47b4587-de0d-430c-ae2a-30df50f45d12",
        "lecturer": {"email": "mullinstammy@yahoo.com", "name": "Edwin Lewis"},
        "created_at": 1472731865.294826,
        "room_name": "Newton Shore",
        "name": "Diverse needs-based parallelism",
        "icon": "firefox",
        "code": "DNBS2110",
        "status": "open",
        "next_session": {"day": "MONDAY", "time": "14:00"}
    },
    {
        "public_id": "c87c7781-365a-477c-8985-93bbb2f8b6e7",
        "lecturer": {"email": "williamsjason@gmail.com", "name": "Jill Krueger"},
        "created_at": 1472731865.296625,
        "room_name": "Ramsey View",
        "name": "Focused next generation frame",
        "code": "FNGF3105",
        "icon": "heartbeat",
        "status": "closed",
        "next_session": {"day": "WEDNESDAY", "time": "10:00"}
    },
    {
        "public_id": "0e8d3a9d-438e-409f-9bf6-c2e104b0156f",
        "lecturer": {"email": "tommccarthy@yahoo.com", "name": "Abigail Garcia"},
        "created_at": 1472731865.298275,
        "room_name": "Tyler Springs",
        "name": "Advanced even-keeled flexibility",
        "code" : "AEKF3324",
        "icon": "resistance",
        "status": "closed",
        "next_session": {"day": "FRIDAY", "time": "11:00"}
    },
    {
        "public_id": "30d28006-9656-4f5b-a20b-1d8f002b9c2a",
        "lecturer": {"email": "monicayang@gmail.com", "name": "Joel Garner"},
        "created_at": 1472731865.299898,
        "room_name": "Jimmy Land",
        "name": "Devolved fault-tolerant flexibility",
        "icon": null,
        "status": "closed",
        "next_session": {"day": "TUESDAY", "time": "12:00"}
    },
    {
        "public_id": "e09b91f7-daf4-4494-9e50-eca3256bb389",
        "lecturer": {"email": "gporter@hotmail.com", "name": "Christopher Nguyen"},
        "created_at": 1472731865.301427,
        "room_name": "Medina Vista",
        "name": "Ergonomic tertiary leverage",
        "icon": null,
        "status": "closed",
        "next_session": {"day": "THURSDAY", "time": "16:00"}
    },
    {
        "public_id": "61186a2b-52b7-4b5d-8c34-a80c4530e30e",
        "lecturer": {"email": "sandra92@gmail.com", "name": "Robert Smith"},
        "created_at": 1472731865.302769,
        "room_name": "White Walks",
        "name": "Integrated 24/7 functionalities",
        "icon": null,
        "status": "closed",
        "next_session": {"day": "WEDNESDAY", "time": "17:00"}
    },
    {
        "public_id": "f3eeed02-faf6-4155-905a-d803c97e9b61",
        "lecturer": {"email": "warnertracy@kelly-foley.com", "name": "Amanda Frank"},
        "created_at": 1472731865.305309,
        "room_name": "Brooke Field",
        "name": "Future-proofed content-based framework",
        "icon": null,
        "status": "closed",
        "next_session": {"day": "FRIDAY", "time": "12:00"}
    },
    {
        "public_id": "f385db35-3b11-4136-b4b0-86aef9bcbe79",
        "lecturer": {"email": "andersonjulie@hotmail.com", "name": "Dana Hamilton"},
        "created_at": 1472731865.307151,
        "room_name": "Gibson Ridges",
        "name": "Innovative web-enabled instruction set",
        "icon": null,
        "status": "closed",
        "next_session": {"day": "TUESDAY", "time": "9:00"}
    },
    {
        "public_id": "651fa1eb-7407-4765-ba86-73b5a840d0f0",
        "lecturer": {"email": "shawscott@williams.com", "name": "Tony Hernandez"},
        "created_at": 1472731865.309331,
        "room_name": "Timothy Isle",
        "name": "Integrated foreground infrastructure",
        "icon": null,
        "status": "closed",
        "next_session": {"day": "MONDAY", "time": "12:00"}
    }]


Vue.component('unit-panel', {
    template: document.getElementById('unit-template').innerHTML,
    props: ['unit'],
    data: function () {
        return {
            clicked: false
        }
    },
    methods: {
        click: function () {
            console.log(this.clicked)
            this.clicked = !this.clicked
            window.location.href= '/room'
        }
    },
})


var app = new Vue({
    el: '#app',
    data: {
        units: units
    }


})
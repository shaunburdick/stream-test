# Stream Node Test

This is just a playground to test the creation of a node map as well as display and streaming from a swagger based api.

## Done
- Service to generate random domain/ip nodes and relationships
- Service to periodically update those nodes/services to simulate change
- Swagger compliant API to query map
- docker-compose setup to launch images for dev/testing

## To-Do
- Update API to be truly in spec with jsonapi
- Get the UI to work: I really didn't spend much time on it, the API is there but the UI/D3 needs love to work
- Stream Updates: The background service updates the map at interval and I would like to stream those updates to users using Neo4j's subscribe and websockets
- Fix docker concurency issue: really I blame Neo4J's docker image, it launches then reboots Neo4J to configure it and that throws off my service that expects it to be running

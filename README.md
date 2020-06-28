A simple frontend for the Don't Mess with Cthulhu business logic that Dave Otaguro wrote.

# Overview

This is an Angular TypeScript frontend that uses AngularFire to connect to a 
FireStore database. There currently is no server, nor are there server-less functions -
all of the state is read from and written to by the client. This is not the
most robust way to do this, as there should be some sort of API that the client
hits, but it was the easiest.

## Architecture

The original intention of the game logic was for it to be a NodeJS backend that
stored all the games in memory was accessed by the frontend via an API. However, when I was writing this, I
had so much trouble figuring out how to do a streaming API with FireBase (and
I didn't want to do polling) that I just decided to make it completely serverless
and power it with a FireStore database.

That being said, the application is designed in such a way that if we want to
back to the other way, we can easily do so. This was done with the following
architecture:

- Facade - this class is the one written by Dave and contains all of the business
logic for the game itself.
- GameStore - this is Data Access Object interface that is used as the middle-man
between the Facade and wherever the game data is stored. Dave's original 
implementation stored everything in memory, so I factored that out into an
in-memory GameStore. I also created a Firestore GameStore that stores all of
the data in a Firestore DataBase.
- GameService is the class that the client uses to communicate with the Facade.
As the Facade was originally intended (to live on the backend), the GameService
could be a series of RPC calls to the server. However, in the current 
implementation, GameService simply proxies calls through to the Facade, which
is also located on the client.

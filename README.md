# SwitchJockey
An intelligent, automated video switcher for WebGL shaders.

This application uses machine listening to analyze real-time audio and determine values for high level audio features that are then used to conduct the switching of audio-reactive shaders written with the OpenGL Shading Language and sourced from the [Shadertoy](https://www.shadertoy.com/) community.

## Getting Started

The application will need access to your computer's microphone so to try this out locally you'll have to create a certificate first:

`openssl req -new -x509 -keyout server.pem -out server.pem -days 365 -nodes`

Then run an https server, maybe with [Python?](https://piware.de/2011/01/creating-an-https-server-in-python/)

## Loading Custom Shaders

There are a few shader sets to choose from by default but you can also load your own. In order to do so, the following steps are required:

1. Browse around [Shadertoy](https://www.shadertoy.com/) to find a few shaders you like and copy each one into a file in the same directory:
    ```
    shader_folder/
      shader1.frag
      shader2.frag
      ...
    ```
2. (Optional) Add a brightness uniform to the shaders so that the brightness slider in the application can have an effect:
    ```
    uniform float     brightness;
    ...
    // output final color
    fragColor = vec4(ledColor, 1.0) * brightness;
    ```
3. Add the high level visual features in comments at the end of each shader file:
    ```
    // Visual Features
    // complexity=1
    // contrast=0
    // movement=0
    ```
4. Now in the app you can just select your folder of shaders and they should load and be displayed.

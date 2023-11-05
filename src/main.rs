use std::process::Stdio;

use futures_util::{SinkExt, StreamExt, TryFutureExt};
use log::{error, info};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::process::{Child, Command};
use warp::ws::{Message, WebSocket};
use warp::Filter;

static INDEX_HTML: &str = include_str!("../static/index.html");
static EXECUTOR_JS: &str = include_str!("../static/executor.js");
static MAIN_JS: &str = include_str!("../static/main.js");
static DARK_CSS: &str = include_str!("../static/dark.css");
static CONT_CSS: &str = include_str!("../static/contrast.css");

#[tokio::main]
async fn main() {
    pretty_env_logger::init();

    let socket = warp::path("socket")
        .and(warp::ws())
        .map(|ws: warp::ws::Ws| ws.on_upgrade(move |socket| user_connected(socket)));

    let index = warp::path::end().map(|| warp::reply::html(INDEX_HTML));
    let executor = warp::path("executor.js")
        .map(|| warp::reply::with_header(EXECUTOR_JS, "content-type", "text/javascript"));
    let main = warp::path("main.js")
        .map(|| warp::reply::with_header(MAIN_JS, "content-type", "text/javascript"));
    let dark = warp::path("dark.css")
        .map(|| warp::reply::with_header(DARK_CSS, "content-type", "text/css"));
    let cont = warp::path("contrast.css")
        .map(|| warp::reply::with_header(CONT_CSS, "content-type", "text/css"));

    let routes = socket.or(index).or(executor).or(main).or(dark).or(cont);

    warp::serve(routes).run(([127, 0, 0, 1], 3030)).await;
}

async fn user_connected(ws: WebSocket) {
    info!("a user connected");

    let (mut ws_tx, mut ws_rx) = ws.split();

    let mut child = Command::new("bash")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();

    let mut stdin = child.stdin.take().unwrap();
    let mut stdout = child.stdout.take().unwrap();
    let mut stderr = child.stderr.take().unwrap();

    tokio::spawn(async move {
        let mut out_buffer = [0; 1024];
        let mut err_buffer = [0; 1024];
        loop {
            match child.try_wait() {
                Ok(Some(_)) => {
                    kill_child(&mut child).await;
                    break;
                },
                Err(_) => {
                    kill_child(&mut child).await;
                    break;
                },
                _ => (),
            }

            let text = tokio::select! {
                b = stdout.read(&mut out_buffer) => {
                    let bytes = b.unwrap();
                    std::str::from_utf8(&out_buffer[..bytes]).unwrap()
                },
                b = stderr.read(&mut err_buffer) => {
                    let bytes = b.unwrap();
                    std::str::from_utf8(&err_buffer[..bytes]).unwrap()
                },
            };
            let message = Message::text(text);
            ws_tx
                .send(message)
                .unwrap_or_else(|e| {
                    error!("websocket send: {}", e);
                })
                .await;
        }
    });

    while let Some(result) = ws_rx.next().await {
        let msg = result.unwrap();
        let message = msg.to_str().unwrap();
        stdin.write_all(message.as_bytes()).await.unwrap();
    }

    info!("a user disconnected");
}

async fn kill_child(child: &mut Child) {
    if let Err(e) = child.kill().await {
        error!("error killing child: {}", e);
    }
}

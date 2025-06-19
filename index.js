@@ -1,38 +1,47 @@
const http = require('http');
@@ -2,7 +2,7 @@ const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const url = require('url');
const PORT = 3000;

// Database connection settings
const dbConfig = {
    host: 'localhost',
@@ -11,63 +11,45 @@ const dbConfig = {
    user: 'root',
    password: '',
    database: 'todolist',
  };

};

  async function retrieveListItems() {
async function retrieveListItems() {
    try {
      // Create a connection to the database
      const connection = await mysql.createConnection(dbConfig);
      

      // Query to select all items from the database
      const query = 'SELECT id, text FROM items';
      

      // Execute the query
      const [rows] = await connection.execute(query);
      

      // Close the connection
      await connection.end();
      

      // Return the retrieved items as a JSON array
      return rows;
        const connection = await mysql.createConnection(dbConfig);
        const query = 'SELECT id, text FROM items';
        const [rows] = await connection.execute(query);
        await connection.end();
        return rows;
    } catch (error) {
      console.error('Error retrieving list items:', error);
      throw error; // Re-throw the error
        console.error('Error retrieving list items:', error);
        throw error;
    }
  }

@@ -46,6 +55,7 @@ async function getHtmlRows() {
    ];*/

    const todoItems = await retrieveListItems();
}

    // Generate HTML for each item
    return todoItems.map(item => `
@@ -55,33 +65,78 @@ async function getHtmlRows() {
            <td><button class="delete-btn">×</button></td>
        </tr>
    `).join('');
async function addListItem(text) {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const query = 'INSERT INTO items (text) VALUES (?)';
        await connection.execute(query, [text]);
        await connection.end();
    } catch (error) {
        console.error('Error adding list item:', error);
        throw error;
    }
}

// Modified request handler with template replacement
async function handleRequest(req, res) {
    if (req.url === '/') {
    const parsedUrl = url.parse(req.url, true);

    if (req.method === 'GET' && parsedUrl.pathname === '/') {
        try {
            const html = await fs.promises.readFile(
                path.join(__dirname, 'index.html'), 
                'utf8'
            );
            

            // Replace template placeholder with actual content
            const processedHtml = html.replace('{{rows}}', await getHtmlRows());

            const rows = await getHtmlRows();
            const processedHtml = html.replace('{{rows}}', rows);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(processedHtml);
        } catch (err) {
            console.error(err);
@@ -76,12 +58,41 @@ async function handleRequest(req, res) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error loading index.html');
        }
    } else {
    } 
    else if (req.method === 'POST' && parsedUrl.pathname === '/add') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const { text } = JSON.parse(body);
                await addListItem(text);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                console.error(error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Failed to add item' }));
            }
        });
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
    }
}

// Create and start server
async function getHtmlRows() {
    const todoItems = await retrieveListItems();
    return todoItems.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.text}</td>
            <td></td>
        </tr>
    `).join('');
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

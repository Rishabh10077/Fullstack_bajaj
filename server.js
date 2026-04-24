const express = require("express")
const cors = require("cors")
const PORT = process.env.PORT || 3000
const app = express()

app.use(cors())
app.use(express.json())

function buildTree(node, graph, visited) {
    if (visited.has(node)) return {}
    visited.add(node)

    let obj = {}
    if (graph[node]) {
        for (let i = 0; i < graph[node].length; i++) {
            obj[graph[node][i]] = buildTree(graph[node][i], graph, visited)
        }
    }
    return obj
}

function getDepth(node, graph, visited) {
    if (visited.has(node)) return 0
    visited.add(node)

    if (!graph[node]) return 1

    let max = 0
    for (let i = 0; i < graph[node].length; i++) {
        max = Math.max(max, getDepth(graph[node][i], graph, new Set(visited)))
    }
    return max + 1
}

function hasCycle(node, graph, visited, stack) {
    if (!visited.has(node)) {
        visited.add(node)
        stack.add(node)

        if (graph[node]) {
            for (let neigh of graph[node]) {
                if (!visited.has(neigh) && hasCycle(neigh, graph, visited, stack)) {
                    return true
                } else if (stack.has(neigh)) {
                    return true
                }
            }
        }
    }
    stack.delete(node)
    return false
}

function dfsCollect(node, graph, visited, comp) {
    if (visited.has(node)) return
    visited.add(node)
    comp.push(node)

    if (graph[node]) {
        for (let n of graph[node]) {
            dfsCollect(n, graph, visited, comp)
        }
    }
}

app.post("/bfhl", (req, res) => {

    const data = req.body.data || []

    let valid = []
    let invalid = []
    let duplicate = []

    let seen = new Set()

    for (let i = 0; i < data.length; i++) {
        let s = data[i].trim()

        if (/^[A-Z]->[A-Z]$/.test(s) && s[0] !== s[3]) {
            if (!seen.has(s)) {
                valid.push(s)
                seen.add(s)
            } else if (!duplicate.includes(s)) {
                duplicate.push(s)
            }
        } else {
            invalid.push(data[i])
        }
    }

    let graph = {}
    let children = new Set()
    let nodes = new Set()

    for (let v of valid) {
        let p = v[0]
        let c = v[3]

        nodes.add(p)
        nodes.add(c)
        children.add(c)

        if (!graph[p]) graph[p] = []
        graph[p].push(c)
    }

    let roots = []
    nodes.forEach(n => {
        if (!children.has(n)) roots.push(n)
    })

    let visitedGlobal = new Set()
    let hierarchies = []
    let total_trees = 0
    let total_cycles = 0
    let maxDepth = 0
    let largestRoot = ""

    function processRoot(r) {
        if (visitedGlobal.has(r)) return

        let comp = []
        dfsCollect(r, graph, visitedGlobal, comp)

        let cycle = hasCycle(r, graph, new Set(), new Set())

        if (cycle) {
            total_cycles++
            hierarchies.push({
                root: comp.sort()[0],
                tree: {},
                has_cycle: true
            })
        } else {
            total_trees++
            let tree = {}
            tree[r] = buildTree(r, graph, new Set())
            let depth = getDepth(r, graph, new Set())

            if (depth > maxDepth || (depth === maxDepth && r < largestRoot)) {
                maxDepth = depth
                largestRoot = r
            }

            hierarchies.push({
                root: r,
                tree: tree,
                depth: depth
            })
        }
    }

    // Process roots first
    for (let r of roots) processRoot(r)

    // Process remaining nodes (cycle groups)
    for (let n of nodes) {
        if (!visitedGlobal.has(n)) {
            processRoot(n)
        }
    }

    res.json({
        user_id: "Rishabh1007",
        email_id: "rk0976@srmist.edu.in",
        college_roll_number: "RA2311003010579",
        hierarchies: hierarchies,
        invalid_entries: invalid,
        duplicate_edges: duplicate,
        summary: {
            total_trees: total_trees,
            total_cycles: total_cycles,
            largest_tree_root: largestRoot
        }
    })
})

app.listen(PORT, () => {
    console.log("Server running on port", PORT)
})
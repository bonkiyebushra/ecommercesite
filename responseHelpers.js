// Helper functions

export function sendError(res, message) {

    res.status(500).json({
        "result": {
            success: false,
            message: message
        }
    })
    // res.json({
    //     "result": {
    //         success: false,
    //         message: message
    //     }
    // })
}

export function sendSuccessResponse(res) {
    res.json({
        "result": {
            success: true
        }
    })
}

export function sendDataResponse(res, data) {
    res.json({
        "data": data
    })
}
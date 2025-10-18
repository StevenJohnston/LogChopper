### Introduction

This document outlines the implementation of the `AfrMlShifterNode`. The purpose of this node is to use a machine learning model to correct the variable time lag in Air-Fuel Ratio (AFR) sensor data from vehicle log files.

The node will take one or more log data objects as input. It will feature a "Train Model" button that, when clicked, will train an LSTM (Long Short-Term Memory) neural network on the input data. The model will learn the relationship between various engine parameters (like RPM, MAP, IPW) and the AFR. Once trained, it will generate a corrected AFR reading. The output of this node will be a new log data object containing the corrected AFR, which can then be connected to other nodes for analysis and visualization.

---

### Implementation Details

#### Phase 1: Project Setup & Dependencies

-   [ ] **Create a New Git Branch:**
    -   Create a dedicated feature branch for this implementation.

-   [ ] **Install Dependencies:**
    -   Install the TensorFlow.js library, which is required for building and training the machine learning model.
        ```bash
        npm install @tensorflow/tfjs
        ```
    -   The project already uses `csvtojson`, which will be used for data handling in the worker.

#### Phase 2: Node Scaffolding

-   [ ] **Create Node Directory and Files:**
    -   Create a new directory: `app/_components/FlowNodes/AfrMlShifter/`.
    -   Inside this directory, create the following files:
        -   `AfrMlShifterNode.tsx`: The main React component for the node's UI and logic.
        -   `AfrMlShifterTypes.tsx`: TypeScript type definitions for the node.
        -   `AfrMlShifterWorker.ts`: The web worker that will handle all heavy data processing and machine learning tasks.
        -   `AfrMlShifterWorkerTypes.ts`: TypeScript types for messages passed between the node and the worker.

-   [ ] **Define Node UI:**
    -   The `AfrMlShifterNode.tsx` component should include:
        -   An input `CustomHandle` that accepts `Log` data types.
        -   An output `CustomHandle` that provides a `Log` data type.
        -   A "Train Model" button to initiate the training process.
        -   A status display area to show messages from the worker (e.g., "Preprocessing data...", "Training model, epoch 5/30...", "Done!").

#### Phase 3: Worker Implementation (Data Processing & ML)

-   [ ] **Implement Worker Message Handling (`AfrMlShifterWorker.ts`):**
    -   Set up the worker to receive log data from the main thread. Use `BaseLogWorker.ts` as a reference for handling incoming data.

-   [ ] **Data Preprocessing:**
    -   **Feature Selection:** Define the input features (`['RPM', 'MAP', 'IPW', 'Load', 'TimingAdv', 'TPS']`) and the target feature (`AFR`).
    -   **Data Cleaning:** Filter out any rows with invalid or missing data.
    -   **Data Normalization:** Implement a min-max scaler to normalize all feature and target columns to a 0-1 range. Store the `min` and `max` for the `AFR` column to un-normalize the predictions later.
    -   **Sequence Creation:** Write a function to transform the data into overlapping time-series sequences suitable for an LSTM model (e.g., a window size of 15 time steps).

-   [ ] **Model Development (TensorFlow.js):**
    -   **Define Model Architecture:** Create a `tf.sequential` model with an `lstm` layer and a `dense` output layer. The input shape should match the sequence window size and number of features.
    -   **Compile Model:** Compile the model using the `adam` optimizer and `meanSquaredError` as the loss function.

-   [ ] **Model Training:**
    -   **Create Training Routine:** Implement an `async` function to handle the training.
    -   **Convert Data to Tensors:** Convert the preprocessed sequences into `tf.tensor` objects.
    -   **Call `model.fit()`:** Train the model. Use the `onEpochEnd` callback to `postMessage` progress updates (epoch number, loss) back to the main thread.

-   [ ] **Prediction and Output:**
    -   **Generate Predictions:** After training, use `model.predict()` on the input sequences to get the corrected AFR values.
    -   **Un-normalize Predictions:** Convert the model's 0-1 output back into real AFR values using the saved `min` and `max`.
    -   **Create New Log Data:** Create a copy of the original log data and replace the original `AFR` column with the new `Corrected AFR` values.
    -   **Send Result:** `postMessage` the complete, corrected log data object back to the main thread.

#### Phase 4: Node Component and Flow Integration

-   [ ] **Implement Node-to-Worker Communication (`AfrMlShifterNode.tsx`):**
    -   Instantiate the `AfrMlShifterWorker`.
    -   When the "Train Model" button is clicked, send the input log data to the worker.
    -   Implement an `onmessage` handler to listen for progress updates and the final result from the worker. Update the node's status display and output data accordingly.

-   [ ] **Update Flow Store (`app/store/useFlow.ts`):**
    -   Add the `AfrMlShifterNodeType` to the `MyNode` type union to make the flow aware of the new node type.

-   [ ] **Register Node in `Flow.tsx` (`app/_components/Flow.tsx`):**
    -   Import the `AfrMlShifterNode` component.
    -   Add it to the `nodeTypes` map with the key `afrMlShifter`.

-   [ ] **Define Handle `dataType`:**
    -   Ensure the input and output `CustomHandle` components have the correct `dataType` set to `'Log'` to allow connections with other log-related nodes.

#### Phase 5: UI Integration

-   [ ] **Add Node to Node Selector UI:**
    -   Create a new button component: `app/_components/NodeSelector/AfrMlShifterButton.tsx`.
    -   Add this button to the main `app/_components/NodeSelector/NodeSelector.tsx` component, likely under a new "Analysis" or "ML" section, to allow users to add it to the canvas.

#### Phase 6: Testing

-   [ ] **Perform Manual Integration Testing:**
    -   Add a `BaseLogNode` and load a log file.
    -   Add the new `AfrMlShifterNode` and connect it to the `BaseLogNode`.
    -   Click "Train Model" and observe the status updates.
    -   Once complete, connect the output of the `AfrMlShifterNode` to a `TableUI` node.
    -   Verify that the `TableUI` displays the original log data plus a new "Corrected AFR" column with the model's output.

/******************************************************************************

Welcome to GDB Online.
  GDB online is an online compiler and debugger tool for C, C++, Python, PHP, Ruby, 
  C#, OCaml, VB, Perl, Swift, Prolog, Javascript, Pascal, COBOL, HTML, CSS, JS
  Code, Compile, Run and Debug online from anywhere in world.

*******************************************************************************/
#include <stdio.h>

int main()
{
    printf("Hello World");

    return 0;
}
// SimpleNeuralNetwork.java
public class SimpleNeuralNetwork {

    private double[][] weights;
    private double learningRate;

    public SimpleNeuralNetwork(int inputSize, int outputSize, double learningRate) {
        this.weights = new double[inputSize + 1][outputSize]; // +1 for bias
        this.learningRate = learningRate;
        initializeWeights();
    }

    private void initializeWeights() {
        // Initialize weights randomly
        for (int i = 0; i < weights.length; i++) {
            for (int j = 0; j < weights[0].length; j++) {
                weights[i][j] = Math.random() * 2 - 1; // Random values between -1 and 1
            }
        }
    }

    public double[] predict(double[] inputs) {
        double[] activations = new double[weights[0].length];
        for (int j = 0; j < weights[0].length; j++) {
            double sum = 0;
            for (int i = 0; i < inputs.length; i++) {
                sum += inputs[i] * weights[i][j];
            }
            sum += 1 * weights[inputs.length][j]; // Bias term
            activations[j] = sigmoid(sum); // Using sigmoid activation function
        }
        return activations;
    }

    public void train(double[] inputs, double[] targetOutputs) {
        double[] predictedOutputs = predict(inputs);
        double[] errors = new double[predictedOutputs.length];

        // Calculate errors
        for (int i = 0; i < predictedOutputs.length; i++) {
            errors[i] = targetOutputs[i] - predictedOutputs[i];
        }

        // Update weights using gradient descent
        for (int j = 0; j < weights[0].length; j++) {
            for (int i = 0; i < inputs.length; i++) {
                weights[i][j] += learningRate * errors[j] * inputs[i];
            }
            weights[inputs.length][j] += learningRate * errors[j] * 1; // Update bias weight
        }
    }

    private double sigmoid(double x) {
        return 1 / (1 + Math.exp(-x));
    }

    public static void main(String[] args) {
        SimpleNeuralNetwork nn = new SimpleNeuralNetwork(2, 1, 0.1); // 2 inputs, 1 output, learning rate 0.1

        // Training data for an XOR-like problem
        double[][] trainingInputs = {{0, 0}, {0, 1}, {1, 0}, {1, 1}};
        double[][] trainingOutputs = {{0}, {1}, {1}, {0}};

        for (int epoch = 0; epoch < 10000; epoch++) {
            for (int i = 0; i < trainingInputs.length; i++) {
                nn.train(trainingInputs[i], trainingOutputs[i]);
            }
        }

        // Test the trained network
        System.out.println("0, 0 -> " + nn.predict(new double[]{0, 0})[0]);
        System.out.println("0, 1 -> " + nn.predict(new double[]{0, 1})[0]);
        System.out.println("1, 0 -> " + nn.predict(new double[]{1, 0})[0]);
        System.out.println("1, 1 -> " + nn.predict(new double[]{1, 1})[0]);
    }
}